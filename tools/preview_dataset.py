import os
from datasets import DatasetDict

PATH = os.path.join("resources_dev", "data_sets", "novelist")

dataset = DatasetDict.load_from_disk(PATH)

# print the first n examples
n = 10

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
