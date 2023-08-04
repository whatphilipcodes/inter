import os
import numpy as np

from transformers import (
    DebertaV2Tokenizer,
    DebertaV2ForSequenceClassification,
    DataCollatorWithPadding,
    TrainingArguments,
    Trainer,
)
from datasets import DatasetDict
import evaluate
from src_py.utils import ClassifierLabels

# TOOL SETTINGS #################################################
IN_MODEL = os.path.join("resources_dev", "models_origin", "deberta-v3-base")
IN_DATA = os.path.join("resources_dev", "data_sets", "wisdom")
OUT_MODEL = os.path.join("resources_dev", "models_tuned", "inter-classifier-max-norand")
#################################################################


def run():
    """
    Pretrain the classifier with the wisdom dataset.
    """

    # Load Resources
    encode_mappings = ClassifierLabels.dict
    dataset = DatasetDict.load_from_disk(IN_DATA)
    tokenizer = DebertaV2Tokenizer.from_pretrained(IN_MODEL)
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)
    model = DebertaV2ForSequenceClassification.from_pretrained(
        IN_MODEL, num_labels=len(encode_mappings)
    )

    # Data preprocessing
    def preprocess_function(example):
        output_dict = tokenizer(example["input"], max_length=128, truncation=True)
        output_dict["labels"] = [encode_mappings[e] for e in example["mood"]]
        return output_dict

    tokenized_dataset = dataset.map(
        preprocess_function, batched=True, remove_columns=dataset["train"].column_names
    )

    # Define the metric
    metric = evaluate.load("accuracy")

    def compute_metrics(pred):
        pred_logits = pred.predictions
        pred_classes = np.argmax(pred_logits, axis=-1)
        labels = np.asarray(pred.label_ids)
        return metric.compute(predictions=pred_classes, references=labels)

    # Define the training arguments
    # TESTED WORKING -> {'eval_loss': 0.5034595727920532, 'eval_accuracy': 0.8245614035087719, 'eval_runtime': 78.824, 'eval_samples_per_second': 347.102, 'eval_steps_per_second': 43.388, 'epoch': 1.83}
    # training_args = TrainingArguments(
    #     output_dir=OUT_MODEL,
    #     num_train_epochs=2,
    #     learning_rate=2e-5,
    #     warmup_steps=200,
    #     logging_steps=500,
    #     save_steps=5000,
    #     eval_steps=5000,
    #     evaluation_strategy="steps",
    # )

    # CHAT GPT SUGGESTION -> {'eval_loss': 0.43345701694488525, 'eval_accuracy': 0.8240354938271605, 'eval_runtime': 53.8454, 'eval_samples_per_second': 481.379, 'eval_steps_per_second': 30.086, 'epoch': 2.0}
    training_args = TrainingArguments(
        output_dir=OUT_MODEL,
        num_train_epochs=5,  # Increased from 2 to 5 // 3 seems to have the best loss
        learning_rate=3e-5,  # Adjusting the learning rate
        warmup_steps=500,  # Increasing warmup steps
        per_device_train_batch_size=16,  # Training batch size
        per_device_eval_batch_size=16,  # Evaluation batch size
        gradient_accumulation_steps=2,  # Gradient accumulation
        weight_decay=0.01,  # Weight decay for regularization
        lr_scheduler_type="cosine_with_restarts",  # Learning rate scheduler
        evaluation_strategy="epoch",  # Regular evaluation
        logging_dir=os.path.join(OUT_MODEL, "logs"),  # Logging directory
        logging_steps=100,  # Log every 100 steps
        save_strategy="epoch",  # Save checkpoint every epoch
        save_total_limit=5,  # Limit the number of saved checkpoints
    )

    # Define the trainer
    trainer = Trainer(
        args=training_args,
        compute_metrics=compute_metrics,  # type: ignore
        model=model,  # type: ignore
        tokenizer=tokenizer,
        data_collator=data_collator,
        train_dataset=tokenized_dataset["train"],  # type: ignore
        eval_dataset=tokenized_dataset["test"],  # type: ignore
    )

    # Train the model
    train_metrics = trainer.train().metrics
    trainer.save_metrics("train", train_metrics)


if __name__ == "__main__":
    run()
