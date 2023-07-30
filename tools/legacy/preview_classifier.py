import os
from transformers import pipeline  # type: ignore

# Prevent triton warning
os.environ["XFORMERS_FORCE_DISABLE_TRITON"] = "1"

MODELPATH = os.path.join("resources_dev", "models", "to-delete")

decode_mappings = {
    "LABEL_0": "Czech",
    "LABEL_1": "Danish",
    "LABEL_2": "German",
    "LABEL_3": "Spanish",
    "LABEL_4": "Estonian",
    "LABEL_5": "Finnish",
    "LABEL_6": "French",
    "LABEL_7": "Hungarian",
    "LABEL_8": "Italian",
    "LABEL_9": "Lithuanian",
    "LABEL_10": "Latvian",
    "LABEL_11": "Dutch",
    "LABEL_12": "Polish",
    "LABEL_13": "Portuguese",
    "LABEL_14": "Romanian",
    "LABEL_15": "Slovak",
    "LABEL_16": "Slovenian",
    "LABEL_17": "Swedish",
}

text = input("Enter text to classify: ")

classifier = pipeline(model=MODELPATH, task="text-classification")
result = classifier(text)
print(
    f"Predicted language: {decode_mappings[result[0]['label']]} with probability {result[0]['score']}"  # type: ignore
)
