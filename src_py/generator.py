# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import random
from typing import List, Any, Iterator

import pandas as pd

import torch
from torch.utils.data import DataLoader

from transformers import (
    get_scheduler,
    GPTNeoXForCausalLM,
    GPTNeoXTokenizerFast,
    DataCollatorForLanguageModeling,
)
from datasets import DatasetDict, Dataset

# Local Imports
from . import __backend_config as config
from .utils import get_resource_path, get_cuda, SpecialTokens, InterData

# END IMPORT BLOCK ###########################################################


class Generator:
    """
    Generates text using a finetuned Pythia variant.
    """

    _tokenized_data: DatasetDict
    _train_dataloader: DataLoader

    _optimizer: Any
    _scheduler: Any

    def __init__(
        self,
    ) -> None:
        self.device = get_cuda()
        self.modelpath = os.path.join(get_resource_path(), *config.GEN_PATH)

        # TODO: useful session handling ( advance trained epochs )
        # self._session = deque()
        # set this in the step() method from the TataLoader
        self.trained_conIDs: List[int] = []

        self.model = GPTNeoXForCausalLM.from_pretrained(self.modelpath).to(self.device)  # type: ignore
        self.tokenizer = GPTNeoXTokenizerFast.from_pretrained(self.modelpath)
        self.data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer, mlm=False
        )

        torch.backends.cuda.matmul.allow_tf32 = True  # type: ignore

    # PUBLIC METHODS ###########################################################
    def prepare_training(self, data: DatasetDict, shuffle=False) -> None:
        """
        Prepares the current available data for training.\n
        Info: Since the perplexity eval relies on external models it is not implemented yet and the test split is not used.
        """
        train = data["train"].to_pandas()
        if isinstance(train, Iterator):
            raise NotImplementedError("to_pandas() returned an iterator")
        else:
            df_train = train
        train_grouped = df_train.groupby("conID")

        training_data = []
        for group in train_grouped:
            string_list = self._create_training_str(group[1])
            if shuffle:
                random.shuffle(string_list)
            for item in string_list:
                training_data.append(item)

        training_struct = {"string": training_data}

        training_set = DatasetDict()
        training_set["train"] = Dataset.from_dict(training_struct)

        self._tokenized_data = training_set.map(self._preprocess, batched=True)
        self._tokenized_data = self._tokenized_data.remove_columns("string")
        self._tokenized_data.set_format("torch")

        self._setup_helpers()
        self.model.train()

        torch.cuda.empty_cache()

    def step(self) -> None:
        batch = next(iter(self._train_dataloader))

        # for batch in train_dataloader: # type: ignore
        batch = {k: v.to(self.device) for k, v in batch.items()}

        if "labels" not in batch:
            batch["labels"] = batch["input_ids"]

        outputs = self.model(**batch)
        loss = outputs.loss

        if loss is None:
            raise ValueError(
                "Loss is None. Check the model configuration and input data."
            )

        loss.backward()

        self._optimizer.step()
        self._scheduler.step()
        self._optimizer.zero_grad()

        print(f"Loss: {loss.item()}")

    def get_trained_IDs(self) -> list[int]:
        # get the current trained conversation IDs
        current = self.trained_conIDs
        # reset the trained conversation IDs
        self.conIDs_trained = []
        return current

    def infer(self, input: str, return_tokens: bool = False) -> str | Any:
        self.model.eval()

        # Get input text and tokenize
        inputs = self.tokenizer(input, return_tensors="pt")
        inputs.to(self.device)

        # Run inference
        with torch.no_grad():
            generated_tokens = self.model.generate(
                **inputs,
                do_sample=True,
                num_beams=5,
                max_new_tokens=100,
                min_length=40,
                no_repeat_ngram_size=2,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        raw = self.tokenizer.decode(generated_tokens[0], skip_special_tokens=False)

        # handle encoding errors
        try:
            encoded_text = raw.encode("utf-8")
        except UnicodeEncodeError as e:
            # Handle the exception here (replace the problematic character)
            encoded_text = raw.encode("utf-8", errors="replace")

        if config.DEBUG_MSG:
            print(f"Raw result:\n{encoded_text}")

        if return_tokens:
            return encoded_text, generated_tokens

        # Decode and return the generated text
        return raw

    # END PUBLIC METHODS #######################################################

    # PRIVATE METHODS ##########################################################
    def _preprocess(self, example) -> None:
        return self.tokenizer(
            example["string"],
            padding="max_length",
            truncation=True,
            max_length=int(
                self.model.config.max_position_embeddings * 0.25
            ),  # -> 512 ( of 2028 ) for gpt-neo
        )

    def _create_training_str(self, conversation: pd.DataFrame) -> List[str]:
        # create history from input and responses in conversation list
        result: List[str] = []
        context = conversation["context"].iloc[0]
        for i in range(
            2, len(conversation)
        ):  # XXX: skip first two rows (for some reason first is empty and second and third are the same)
            history = ""
            for j in range(i):
                history += SpecialTokens.input + conversation["input"].iloc[j]
                history += SpecialTokens.response + conversation["response"].iloc[j]
                # create training string
                string = (
                    SpecialTokens.context + context + history + SpecialTokens.endseq
                )
                result.append(string)
        return result

    def _setup_helpers(self) -> None:
        self._train_dataloader = DataLoader(
            self._tokenized_data["train"],  # type: ignore
            batch_size=config.GEN_BATCH_SIZE,
            shuffle=False,
        )

        self._optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=config.GEN_LEARNING_RATE,
            fused=True,
        )

        self._scheduler = get_scheduler(
            "linear",
            optimizer=self._optimizer,
            num_warmup_steps=0,
            num_training_steps=len(self._train_dataloader),
        )

    # END PRIVATE METHODS #######################################################
