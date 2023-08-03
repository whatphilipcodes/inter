import os
from datasets import load_dataset, DatasetDict
from src_py.utils import get_resource_path

IN = os.path.join(get_resource_path(), "data", "wisdom")
OUT = os.path.join(get_resource_path(), "data", "wisdom_arrow")
dataset: DatasetDict = load_dataset("parquet", data_dir=IN)  # type: ignore
dataset.save_to_disk(OUT)
print(f"Saved dataset to {OUT}")
