import os
from datasets import (
    load_dataset,
    DatasetDict,
    Dataset,
    disable_caching,
    concatenate_datasets,
)

# TOOL SETTINGS #################################################
IN_WISDOM = os.path.join("resources_dev", "data_sets", "wisdom-parquet")
IN_NOVELIST = os.path.join("resources_dev", "data_sets", "novelist-dev-parquet")
OUT_WISDOM = os.path.join("resources_dev", "data_sets", "wisdom")
OUT_NOVELIST = os.path.join("resources_dev", "data_sets", "novelist-dev")
#################################################################

disable_caching()
if os.path.exists(IN_WISDOM):
    input: DatasetDict = load_dataset("parquet", data_dir=IN_WISDOM)  # type: ignore
    wisdom: Dataset = concatenate_datasets([input["train"], input["test"]])
    wisdom.save_to_disk(OUT_WISDOM)
    print(f"Saved wisdom to {OUT_WISDOM}")

# if os.path.exists(IN_NOVELIST):
#     novelist: DatasetDict = load_dataset("parquet", data_dir=IN_NOVELIST)  # type: ignore
#     novelist.save_to_disk(OUT_NOVELIST)
#     print(f"Saved novelist to {OUT_NOVELIST}")
