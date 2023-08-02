import os
from datasets import DatasetDict

from src_py.utils import get_resource_path

name = "2023-08-02_10-02-28-116595"
PATH = os.path.join(get_resource_path(), "data", "inter", name)

dataset = DatasetDict.load_from_disk(PATH)
print(dataset)
print(dataset["train"][50])
