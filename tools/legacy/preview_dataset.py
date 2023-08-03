import os
from datasets import DatasetDict

from src_py.utils import get_resource_path

PATH = os.path.join(get_resource_path(), "data", "wisdom_arrow")

dataset = DatasetDict.load_from_disk(PATH)
print(dataset)
print(dataset["train"][50])
