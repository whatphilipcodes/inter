# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import numpy as np

import transformers
from transformers import AutoTokenizer, AutoModelForSequenceClassification, DataCollatorWithPadding, TrainingArguments, Trainer  # type: ignore

from datasets import load_dataset, load_metric

# Local Imports
from src_py.utils import get_resource_path

# END IMPORT BLOCK ###########################################################


def run():
    """
    Test training a simple classifier
    """
    print("Transformers at " + transformers.__version__)  # type: ignore

    MODELPATH = os.path.join(get_resource_path(), "models", "deberta-v3-base")
    DATAPATH = os.path.join(get_resource_path(), "data", "europarl_select")
    OUTPUTPATH = os.path.join(get_resource_path(), "models", "forgot-to-name")

    # Load the dataset
    dataset = load_dataset("parquet", data_dir=DATAPATH)

    # Load the tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODELPATH)

    # Preprocess functions
    encode_mappings = {
        "cs": 0,
        "da": 1,
        "de": 2,
        "es": 3,
        "et": 4,
        "fi": 5,
        "fr": 6,
        "hu": 7,
        "it": 8,
        "lt": 9,
        "lv": 10,
        "nl": 11,
        "pl": 12,
        "pt": 13,
        "ro": 14,
        "sk": 15,
        "sl": 16,
        "sv": 17,
    }

    def preprocess_function(example):
        output_dict = tokenizer(example["text"], max_length=128, truncation=True)
        output_dict["labels"] = [encode_mappings[e] for e in example["language"]]
        return output_dict

    # Preprocess the dataset
    tokenized_dataset = dataset.map(preprocess_function, batched=True, remove_columns=dataset["train"].column_names)  # type: ignore

    # Load the model
    model = AutoModelForSequenceClassification.from_pretrained(MODELPATH, num_labels=18)
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    # Define the metric
    accuracy = load_metric("accuracy")

    def compute_metrics(pred):
        pred_logits = pred.predictions
        pred_classes = np.argmax(pred_logits, axis=-1)
        labels = np.asarray(pred.label_ids)

        acc = accuracy.compute(predictions=pred_classes, references=labels)  # type: ignore

        return {"accuracy": acc["accuracy"]}

    # Define the training arguments
    training_args = TrainingArguments(
        output_dir=OUTPUTPATH,
        num_train_epochs=2,
        learning_rate=2e-5,
        warmup_steps=200,
        logging_steps=500,
        save_steps=5000,
        eval_steps=5000,
        evaluation_strategy="steps",
    )

    # Define the trainer
    trainer = Trainer(
        args=training_args,
        compute_metrics=compute_metrics,
        model=model,
        tokenizer=tokenizer,
        data_collator=data_collator,
        train_dataset=tokenized_dataset["train"],  # type: ignore
        eval_dataset=tokenized_dataset["validation"],  # type: ignore
    )

    # Train the model
    train_metrics = trainer.train().metrics
    trainer.save_metrics("train", train_metrics)
