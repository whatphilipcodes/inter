import os
from datasets import load_dataset

name = "europarl_select_50k"
PATH = os.path.join("resources_dev", "data", name)

dataset = load_dataset("parquet", data_dir=PATH)
print(dataset)
