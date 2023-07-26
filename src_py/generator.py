# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import torch

from torch.utils.data import DataLoader
from tqdm.auto import tqdm

from transformers import (
    GPTNeoXForCausalLM,
    GPTNeoXTokenizerFast,
    DataCollatorWithPadding,
    get_scheduler,
    SchedulerType,
)
from datasets import (
    load_dataset,
    DatasetDict,
    Dataset,
    IterableDatasetDict,
    IterableDataset,
)
import evaluate

# Local Imports
from .utils import get_resource_path, get_cuda

# END IMPORT BLOCK ###########################################################


class Classifier:
    def __init__(self, modelroot: str, dataroot: str) -> None:
        # File paths
        self.modelpath = os.path.join(get_resource_path(), "models", modelroot)
        self.datapath = os.path.join(get_resource_path(), "data", dataroot)

        # Load infrastructure
        self.device = get_cuda()
        self.model = GPTNeoXForCausalLM.from_pretrained(self.modelpath).to(self.device)
        self.tokenizer = GPTNeoXTokenizerFast.from_pretrained(self.modelpath)
        self.data_collator = DataCollatorWithPadding(tokenizer=self.tokenizer)

        # special tokens
        self.tok_input = "[INPUT]"
        self.tok_response = "[RESPONSE]"

        # Load dataset
        self.dataset = load_dataset("parquet", data_dir=self.datapath)

        self.num_epochs = 2

        # Empty Globals
        self.tokenized_dataset: DatasetDict | Dataset | IterableDatasetDict | IterableDataset
        self.train_dataloader: DataLoader
        self.eval_dataloader: DataLoader

        self.optimizer: torch.optim.Adam
        self.scheduler: SchedulerType
        self.num_training_steps: int

        self.metric: evaluate.EvaluationModule

        # self.progress_bar: tqdm

        # Prepare Runtime
        self.setup_data()
        self.setup_training()

    def setup_data(self):
        ### Preprocessing
        def preprocess_function(example):
            output_dict = self.tokenizer(
                example["text"], max_length=128, truncation=True, padding="max_length"
            )
            output_dict["labels"] = [
                self.encode_mappings[e] for e in example["language"]
            ]
            return output_dict

        self.tokenized_dataset = self.dataset.map(preprocess_function, batched=True)  # type: ignore
        # print(tokenized_dataset.column_names) # type: ignore

        ### Postprocessing
        self.tokenized_dataset = self.tokenized_dataset.remove_columns(
            ["language", "text"]
        )
        self.tokenized_dataset.set_format("torch")  # type: ignore
        # print(tokenized_dataset.column_names) # type: ignore

        ### Set up data loaders
        self.train_dataloader = DataLoader(
            self.tokenized_dataset["train"], shuffle=True, batch_size=8, collate_fn=self.data_collator  # type: ignore
        )
        self.eval_dataloader = DataLoader(
            self.tokenized_dataset["test"], batch_size=8, collate_fn=self.data_collator  # type: ignore
        )

    def setup_training(self):
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=2e-5)
        # lr_scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=1, gamma=0.1)
        self.num_training_steps = self.num_epochs * len(self.train_dataloader)  # type: ignore
        self.lr_scheduler = get_scheduler(
            "linear",
            optimizer=self.optimizer,
            num_warmup_steps=0,
            num_training_steps=self.num_training_steps,
        )

        self.metric = evaluate.load("accuracy")
        # self.progress_bar = tqdm(range(self.num_training_steps))

    def training_step(self):
        self.model.train()

        batch = next(iter(self.train_dataloader))

        # for batch in train_dataloader: # type: ignore
        batch = {k: v.to(self.device) for k, v in batch.items()}
        outputs = self.model(**batch)
        loss = outputs.loss
        loss.backward()

        self.optimizer.step()
        self.lr_scheduler.step()
        self.optimizer.zero_grad()
        # self.progress_bar.update(1)

    def save(self):
        self.model.save_pretrained(
            os.path.join(get_resource_path(), "models", "to-delete")
        )
        self.tokenizer.save_pretrained(
            os.path.join(get_resource_path(), "models", "to-delete")
        )

    # yes, i know how unneccesary the async is, but I hate this tqdm 'oh there was still one iteration left' ruining my console view
    async def evaluate(self):
        self.model.eval()
        print("Evaluating...")
        progress_bar = tqdm(range(len(self.eval_dataloader)))

        for batch in self.eval_dataloader:  # type: ignore
            batch = {k: v.to(self.device) for k, v in batch.items()}
            with torch.no_grad():
                outputs = self.model(**batch)

            logits = outputs.logits
            predictions = torch.argmax(logits, dim=-1)
            self.metric.add_batch(predictions=predictions, references=batch["labels"])
            progress_bar.update(1)

        results = self.metric.compute()
        return results

    async def infer(self, text: str):
        self.model.eval()

        # Get input text and tokenize
        inputs = self.tokenizer(text, return_tensors="pt")
        inputs.to(self.device)

        # Run inference
        with torch.no_grad():
            logits = self.model(**inputs).logits

        # Get predicted class
        predicted_class_id = logits.argmax().item()

        tokenized_input = self.tokenizer(text, return_tensors="pt")
        tokenized_input = tokenized_input.to(self.device)

        gen_tokens = self.model.generate(
            input_ids=tokenized_input.input_ids,
            attention_mask=tokenized_input.attention_mask,
            pad_token_id=self.tokenizer.eos_token_id,
            do_sample=True,
            temperature=0.4,
            max_new_tokens=25,
        )

        gen_text = self.tokenizer.batch_decode(gen_tokens)[0]
        return gen_text.replace(text, "")  # Remove prompt from generated text


"""   
import torch
from datasets import load_from_disk
from transformers import GPTNeoXTokenizerFast, GPTNeoXForCausalLM, DataCollatorForLanguageModeling

DEVICE = 'cuda:0' if torch.cuda.is_available() else 'cpu'

tokenizer = GPTNeoXTokenizerFast.from_pretrained('EleutherAI/gpt-neox-1.3B')
model = GPTNeoXForCausalLM.from_pretrained('EleutherAI/gpt-neox-1.3B').to(DEVICE)
optimizer = torch.optim.Adam(model.parameters())

# Assuming you have a parquet dataset
dataset = load_from_disk("path_to_your_parquet_dataset")
dataloader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)

# Data collator will handle padding and batching
data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

model.train()

for epoch in range(100):  # Train for 100 epochs
    for batch in dataloader:  # Assuming you have a PyTorch DataLoader
        # You might need to adjust this depending on the structure of your data
        batch = tokenizer(batch["text"], truncation=True, padding='longest', return_tensors="pt")
        batch = {k: v.to(DEVICE) for k, v in batch.items()}

        optimizer.zero_grad()

        outputs = model(**batch)
        loss = outputs.loss
        loss.backward()

        optimizer.step()

"""
"""
def infer(prompt):
    tokenized_input = tokenizer(prompt, return_tensors='pt')
    tokenized_input = tokenized_input.to(device)

    gen_tokens = model.generate(
        input_ids=tokenized_input.input_ids,
        attention_mask=tokenized_input.attention_mask,
        pad_token_id=tokenizer.eos_token_id,
        do_sample=True,
        temperature=0.4,
        max_new_tokens=25,
    )

    gen_text = tokenizer.batch_decode(gen_tokens)[0]
    return gen_text.replace(prompt, '')  # Remove prompt from generated text

def end_conversation():
    print("You ended the conversation.")
    print("CONVERSATION HISTORY:")
    print(conversation)

    if not os.path.exists(CHATPATH):
        os.makedirs(CHATPATH)
    with open(os.path.join(CHATPATH, 'chat.json'), 'w') as fp:
            json.dump(conversation, fp)

def chat_interface():
    print("Chat Interface loaded.")
    print("Type 'bye' to quit")
    
    while True:
        user_input = input("User: ")
        
        if user_input.lower() == 'bye':
            end_conversation()
            break
        
        prompt = tok_input + '\n' + user_input + '\n' + tok_response + '\n'

        conversation.append(prompt)  # Save user input in the conversation
        input_str = '\n'.join(conversation)
        answer = infer(input_str)
        conversation.append(answer)  # Save generated text in the conversation

        print("Model: " + answer)
"""
