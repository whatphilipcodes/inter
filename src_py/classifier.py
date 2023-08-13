# IMPORT BLOCK ###############################################################
# Lib Imports
import os

import torch
from torch.utils.data import DataLoader

from typing import Any
from collections import deque
from transformers import (
    DebertaV2Tokenizer,
    DebertaV2ForSequenceClassification,
    get_scheduler,
)
from datasets import DatasetDict

# Local Imports
from . import __backend_config as config
from .utils import get_resource_path, get_cuda, ClassifierLabels, Mood

# END IMPORT BLOCK ###########################################################

# tok_data_cls: {'input_ids': [int], 'token_type_ids': [int], 'attention_mask': [int], 'labels': int}


class Classifier:
    """
    Classifies text input as Mood.
    """

    _tokenized_data: DatasetDict
    _train_dataloader: DataLoader

    _optimizer: torch.optim.AdamW
    _scheduler: Any

    def __init__(self):
        self._session = deque()
        self.modelpath = os.path.join(get_resource_path(), *config.CLS_PATH)
        self.device = get_cuda()
        self.model = DebertaV2ForSequenceClassification.from_pretrained(
            self.modelpath, num_labels=len(ClassifierLabels.dict)
        ).to(  # type: ignore
            self.device
        )
        self.tokenizer = DebertaV2Tokenizer.from_pretrained(self.modelpath)

    # PUBLIC METHODS ###########################################################
    def prepare_training(self, data: DatasetDict) -> None:
        # TODO: Check if this improves stability
        torch.cuda.empty_cache()

        self._tokenized_data = data.map(
            self._preprocess, batched=True, remove_columns=data["train"].column_names
        )
        self._tokenized_data.set_format(
            type="torch",
            columns=["input_ids", "token_type_ids", "attention_mask", "labels"],
        )
        self._setup_helpers()
        self.model.train()

    def prepare_inference(self) -> None:
        self.model.eval()

    def step(self) -> None:
        batch = next(iter(self._train_dataloader))
        batch = {k: v.to(self.device) for k, v in batch.items()}
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

        if config.DEBUG_MSG:
            print(f"Loss: {loss.item()}")

    def infer(self, text: str):
        # Set model to eval mode
        self.model.eval()

        # Get input text and tokenize
        inputs = self.tokenizer(text, return_tensors="pt")
        inputs.to(self.device)

        # Run inference
        with torch.no_grad():
            logits = self.model(**inputs).logits

        # Get predicted class
        predicted_class_id = logits.argmax().item()

        # Decode and return
        return self._translate_to_mood(predicted_class_id)

    # END PUBLIC METHODS #######################################################

    # PRIVATE METHODS ##########################################################
    def _translate_to_mood(self, num_cls: Any) -> Mood:
        cls_label = ClassifierLabels.dict.inverse[num_cls]
        mood = Mood(cls_label)
        if config.DEBUG_MSG:
            print(f"Predicted LABEL_ID {num_cls} -> {mood}")
        return mood

    def _setup_helpers(self) -> None:
        self._train_dataloader = DataLoader(
            self._tokenized_data["train"],  # type: ignore
            batch_size=config.CLS_BATCH_SIZE,
            shuffle=True,
        )

        self._optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=config.GEN_LEARNING_RATE,
            fused=True,
        )

        self._scheduler = get_scheduler(
            "linear",
            optimizer=self._optimizer,
            num_warmup_steps=100,
            num_training_steps=len(self._train_dataloader),
        )

    def _preprocess(self, example: Any) -> Any:
        output_dict = self.tokenizer(
            example["input"],
            padding="max_length",
            max_length=config.CLS_MAX_LENGTH,
            truncation=True,
        )
        output_dict["labels"] = [ClassifierLabels.dict[e] for e in example["mood"]]
        return output_dict
