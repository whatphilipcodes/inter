# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import torch

from torch.utils.data import DataLoader
from tqdm.auto import tqdm

from transformers import DebertaV2Tokenizer, DebertaV2ForSequenceClassification, DataCollatorWithPadding, get_scheduler, SchedulerType
from datasets import load_dataset, DatasetDict, Dataset, IterableDatasetDict, IterableDataset
import evaluate

# Local Imports
from .utils import get_resource_path, get_cuda

# END IMPORT BLOCK ###########################################################

class Classifier:

    def __init__(self, modelroot: str, dataroot: str):

        # File paths
        self.modelpath = os.path.join(get_resource_path(), 'models' , modelroot)
        self.datapath = os.path.join(get_resource_path(), 'data', dataroot)

        # Load infrastructure
        self.device = get_cuda()
        self.model = DebertaV2ForSequenceClassification.from_pretrained(self.modelpath, num_labels=18).to(self.device)
        self.tokenizer = DebertaV2Tokenizer.from_pretrained(self.modelpath)
        self.data_collator = DataCollatorWithPadding(tokenizer=self.tokenizer)

        # Load dataset
        self.dataset = load_dataset('parquet', data_dir=self.datapath)

        #  Constants
        self.encode_mappings = {
            'cs': 0,
            'da': 1,
            'de': 2,
            'es': 3,
            'et': 4,
            'fi': 5,
            'fr': 6,
            'hu': 7,
            'it': 8,
            'lt': 9,
            'lv': 10,
            'nl': 11,
            'pl': 12,
            'pt': 13,
            'ro': 14,
            'sk': 15,
            'sl': 16,
            'sv': 17
        }

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
            output_dict = self.tokenizer(example['text'], max_length=128, truncation=True, padding='max_length')
            output_dict['labels'] = [self.encode_mappings[e] for e in example['language']]
            return output_dict

        self.tokenized_dataset = self.dataset.map(preprocess_function, batched=True) # type: ignore
        # print(tokenized_dataset.column_names) # type: ignore

        ### Postprocessing
        self.tokenized_dataset = self.tokenized_dataset.remove_columns(['language', 'text'])
        self.tokenized_dataset.set_format("torch") # type: ignore
        # print(tokenized_dataset.column_names) # type: ignore

        ### Set up data loaders
        self.train_dataloader = DataLoader(
            self.tokenized_dataset["train"], shuffle=True, batch_size=8, collate_fn=self.data_collator # type: ignore
        )
        self.eval_dataloader = DataLoader(
            self.tokenized_dataset["test"], batch_size=8, collate_fn=self.data_collator # type: ignore
        )


    def setup_training(self):

        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=2e-5)
        # lr_scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=1, gamma=0.1)
        self.num_training_steps = self.num_epochs * len(self.train_dataloader) # type: ignore
        self.lr_scheduler = get_scheduler(
            "linear",
            optimizer=self.optimizer,
            num_warmup_steps=0,
            num_training_steps=self.num_training_steps,
        )

        self.metric = evaluate.load('accuracy')
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
        #    self.progress_bar.update(1)


    def save(self):

        self.model.save_pretrained(os.path.join(get_resource_path(), 'models', 'to-delete'))
        self.tokenizer.save_pretrained(os.path.join(get_resource_path(), 'models', 'to-delete'))

    # yes i know how unneccesary the async is, but I hat this tqdm oh there was still one iteration left ruining my console view
    async def evaluate(self):

        self.model.eval()
        print("Evaluating...")
        progress_bar = tqdm(range(len(self.eval_dataloader)))

        for batch in self.eval_dataloader: # type: ignore
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
        inputs = self.tokenizer(text, return_tensors='pt')
        inputs.to(self.device)

        # Run inference
        with torch.no_grad():
            logits = self.model(**inputs).logits

        # Get predicted class
        predicted_class_id = logits.argmax().item()

        decode_mappings = {
            0: 'Czech',
            1: 'Danish',
            2: 'German',
            3: 'Spanish',
            4: 'Estonian',
            5: 'Finnish',
            6: 'French',
            7: 'Hungarian',
            8: 'Italian',
            9: 'Lithuanian',
            10: 'Latvian',
            11: 'Dutch',
            12: 'Polish',
            13: 'Portuguese',
            14: 'Romanian',
            15: 'Slovak',
            16: 'Slovenian',
            17: 'Swedish'
            }

        # Decode and return
        return decode_mappings[predicted_class_id]