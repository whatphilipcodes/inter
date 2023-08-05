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
    candidate_input = cls.infer(item["input"])  # type: ignore
    if candidate_input == "doubt" or candidate_input == "lie":
        item["mood"] = cls.infer(item["response"])  # type: ignore
    else:
        item["mood"] = candidate_input  # type: ignore

for item in tqdm(novelist["test"]):
    candidate_input = cls.infer(item["input"])  # type: ignore
    if candidate_input == "doubt" or candidate_input == "lie":
        item["mood"] = cls.infer(item["response"])  # type: ignore
    else:
        item["mood"] = candidate_input  # type: ignore


novelist.save_to_disk(OUT)
print(f"Saved dataset base to {OUT}")
