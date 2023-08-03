import os
import numpy as np

import transformers
from transformers import AutoTokenizer, AutoModelForSequenceClassification, DataCollatorWithPadding, TrainingArguments, Trainer  # type: ignore
from datasets import load_dataset, load_metric
from src_py.utils import ClassifierLabels

# TOOL SETTINGS #################################################
IN_MODEL = os.path.join("resources_dev", "models_origin", "deberta-v3-base")
IN_DATA = os.path.join("resources_dev", "data_sets", "wisdom")
OUT_MODEL = os.path.join("resources_dev", "models_tuned", "inter-classifier")
#################################################################


def run():
    """
    Test training a simple classifier
    """
    print("Transformers at " + transformers.__version__)  # type: ignore

    # Load the dataset
    dataset = load_dataset("parquet", data_dir=IN_DATA)

    # Load the tokenizer
    tokenizer = AutoTokenizer.from_pretrained(IN_MODEL)

    # Preprocess functions
    encode_mappings = ClassifierLabels.dict

    def preprocess_function(example):
        output_dict = tokenizer(example["text"], max_length=128, truncation=True)
        output_dict["labels"] = [encode_mappings[e] for e in example["language"]]
        return output_dict

    # Preprocess the dataset
    tokenized_dataset = dataset.map(preprocess_function, batched=True, remove_columns=dataset["train"].column_names)  # type: ignore

    # Load the model
    model = AutoModelForSequenceClassification.from_pretrained(
        IN_MODEL, num_labels=len(encode_mappings)
    )
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
        output_dir=OUT_MODEL,
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


if __name__ == "__main__":
    run()
