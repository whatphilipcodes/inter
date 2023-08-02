import os
from src_py.utils import get_resource_path

# generator_add_tokens.py
IN_PATH_TOKEN_MOD = os.path.join(get_resource_path(), "models", "pythia-base")
OUT_PATH_TOKEN_MOD = os.path.join(get_resource_path(), "models", "delete-this")

# prcoess_gutenberg.py
IN_PATH_RAW_GENERATOR = os.path.join(
    get_resource_path(), "data_raw", "generator", "gutenberg"
)
IN_PATH_RAW_CLASSIFIER = os.path.join(
    get_resource_path(), "data_raw", "classifier", "wiki-lies"
)

# classes/parquet_processor.py
IN_DIR_PARQUET = os.path.join(get_resource_path(), "data", "vintage-novelist")
OUT_DIR_PARQUET = os.path.join(get_resource_path(), "data", "vintage-novelist")

# convert_dataset.py
OUT_DIR_SET = os.path.join(get_resource_path(), "data", "inter", "base")

# classifier_pretraining.py
CLS_DATA_DIR = os.path.join(get_resource_path(), "data", "inter", "base")
CLS_IN_DIR_MODEL = os.path.join(get_resource_path(), "models", "deberta-v3-base")
CLS_OUT_DIR_MODEL = os.path.join(get_resource_path(), "models", "classifier-base")
