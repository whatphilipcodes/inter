from datasets import load_dataset, DatasetDict
import tools.__tools_config as cfg

dataset: DatasetDict = load_dataset("parquet", data_dir=cfg.OUT_DIR_PARQUET)  # type: ignore
dataset.save_to_disk(cfg.OUT_DIR_SET)
