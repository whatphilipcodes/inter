import os
from datasets import DatasetDict, disable_caching
from src_py.classifier import Classifier

# TOOL SETTINGS #################################################
IN_NOVELIST = os.path.join("resources_dev", "data_sets", "novelist-dev")
OUT = os.path.join("resources", "data", "base")
#################################################################

cls = Classifier()
disable_caching()
novelist = DatasetDict.load_from_disk(IN_NOVELIST)


def update_mood(example):
    candidate_input = str(cls.infer(example["input"]))
    if candidate_input == "doubt" or candidate_input == "forlang":
        candidate_response = str(cls.infer(example["response"]))
        if candidate_response == "forlang":
            candidate_input = "neutral"
    example["mood"] = candidate_input
    return example


base = novelist.map(update_mood)
base.save_to_disk(OUT)
print(f"Saved dataset base to {OUT}")
