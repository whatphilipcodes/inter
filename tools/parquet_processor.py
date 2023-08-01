import os
import random
import pandas as pd
from typing import Tuple
from sklearn.model_selection import train_test_split

import tools.__tools_config as cfg
from src_py.utils import InterData


class ParquetProcessor:
    dataset: pd.DataFrame
    conID_col_name = "conID"  # XXX has to be renamed if InterData is changed
    msgID_col_name = "msgID"  # XXX has to be renamed if InterData is changed

    def __init__(self, filename: str | None = None) -> None:
        if not filename:
            colums = getattr(InterData, "__annotations__", {})
            self.dataset = pd.DataFrame(columns=list(colums.keys()))
        else:
            self.open_dataframe(filename)

    def add_row(self, data: InterData) -> None:
        row = pd.DataFrame(data.dict(), index=[0])
        self.dataset = pd.concat([self.dataset, row], ignore_index=True)

    def get_convo_id(self) -> int:
        id = self.dataset[self.conID_col_name].max()
        if pd.isna(id):
            return int(0)
        return int(id) + 1

    def _shuffle_conversations(self) -> None:
        # Get unique conversation IDs
        unique_conversations = self.dataset[self.conID_col_name].unique()

        # Convert ndarray to a list and shuffle it
        shuffled_conversations = unique_conversations.tolist()
        random.shuffle(shuffled_conversations)

        # Map the shuffled conversation IDs back to the original DataFrame
        id_mapping = dict(zip(unique_conversations, shuffled_conversations))
        self.dataset[self.conID_col_name] = self.dataset[self.conID_col_name].map(
            id_mapping
        )

        # Sort the DataFrame based on the shuffled conversation IDs
        self.dataset.sort_values(
            by=[self.conID_col_name, self.msgID_col_name], inplace=True
        )

    def _split_dataset(
        self, test_ratio: float = 0.2
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        unique_conversations = self.dataset[self.conID_col_name].unique()
        train_conversations, test_conversations = train_test_split(
            unique_conversations, test_size=test_ratio
        )

        train_data = self.dataset[
            self.dataset[self.conID_col_name].isin(train_conversations)
        ]
        test_data = self.dataset[
            self.dataset[self.conID_col_name].isin(test_conversations)
        ]

        return train_data, test_data

    def get_preview(self, n: int = 5) -> pd.DataFrame:
        return self.dataset.head(n)

    def open_dataframe(self, filename: str) -> None:
        self.dataset = pd.read_parquet(os.path.join(cfg.IN_DIR_PARQUET, filename))

    def save_dataframe(self, shuffle: bool, split: bool) -> None:
        if shuffle:
            self._shuffle_conversations()
        if split:
            # Optionally perform train-test split before saving
            train_data, test_data = self._split_dataset()
            train_data.to_parquet(
                os.path.join(cfg.OUT_DIR_PARQUET, f"train_.parquet"),
                index=False,
            )
            test_data.to_parquet(
                os.path.join(cfg.OUT_DIR_PARQUET, f"test_.parquet"),
                index=False,
            )
        else:
            self.dataset.to_parquet(
                os.path.join(cfg.OUT_DIR_PARQUET, f"inter.parquet"), index=False
            )
