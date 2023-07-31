import os
from src_py.utils import get_resource_path

# add_tokens.py
IN_PATH_TOKEN_MOD = os.path.join(get_resource_path(), "models", "pythia-base")
OUT_PATH_TOKEN_MOD = os.path.join(get_resource_path(), "models", "delete-this")

# prcoess_gutenberg.py
IN_PATH_RAW_GENERATOR = os.path.join(get_resource_path(), "data_raw", "generator")
IN_PATH_RAW_CLASSIFIER = os.path.join(get_resource_path(), "data_raw", "classifier")

# classes/parquet_processor.py
IN_DIR_PARQUET = os.path.join(get_resource_path(), "data", "vintage-novelist")
OUT_DIR_PARQUET = os.path.join(get_resource_path(), "data", "vintage-novelist")
