import os
from datasets import DatasetDict
from tqdm import tqdm

from src_py.classifier import Classifier

# TOOL SETTINGS #################################################
IN_NOVELIST = os.path.join("resources_dev", "data_sets", "novelist")
OUT = os.path.join("resources", "data", "base")
#################################################################

cls = Classifier()

novelist = DatasetDict.load_from_disk(IN_NOVELIST)

for item in tqdm(novelist["train"]):
    item["mood"] = cls.infer(item["input"])  # type: ignore

for item in tqdm(novelist["test"]):
    item["mood"] = cls.infer(item["input"])  # type: ignore


novelist.save_to_disk(OUT)
print(f"Saved dataset base to {OUT}")
