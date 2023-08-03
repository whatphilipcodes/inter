import os
from datasets import DatasetDict, concatenate_datasets

# TOOL SETTINGS #################################################
IN_WISDOM = os.path.join("resources_dev", "data_sets", "wisdom")
IN_NOVELIST = os.path.join("resources_dev", "data_sets", "novelist")
OUT = os.path.join("resources", "data", "base")
#################################################################

wisdom = DatasetDict.load_from_disk(IN_WISDOM)
novelist = DatasetDict.load_from_disk(IN_NOVELIST)

dataset = DatasetDict(
    {
        "train": concatenate_datasets([wisdom["train"], novelist["train"]]),
        "test": concatenate_datasets([wisdom["test"], novelist["test"]]),
    }
)

dataset.save_to_disk(OUT)
print(f"Saved dataset base to {OUT}")
