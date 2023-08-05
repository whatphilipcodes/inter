import os
from datasets import DatasetDict, disable_caching

PATH = os.path.join("resources", "data", "base")

disable_caching()
dataset = DatasetDict.load_from_disk(PATH)

# print the first n examples
n = 6

print(
    "# TRAIN SPLIT ######################################################################################################################"
)

for i in range(n):
    print(dataset["train"][i])
    print()

print(
    "# TEST SPLIT ######################################################################################################################"
)

for i in range(n):
    print(dataset["test"][i])
    print()
