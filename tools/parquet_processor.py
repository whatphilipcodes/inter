import os
import random
import pandas as pd
from typing import Tuple, List
from sklearn.model_selection import train_test_split
from src_py.utils import InterData


class ParquetProcessor:
    dataset: pd.DataFrame
    conID_col_name = "conID"  # XXX has to be renamed if InterData is changed
    msgID_col_name = "msgID"  # XXX has to be renamed if InterData is changed
    out_path: str

    rows_list: List[dict]  # List to store rows as dictionaries

    def __init__(self, out_path: str) -> None:
        colums = getattr(InterData, "__annotations__", {})
        self.dataset = pd.DataFrame(columns=list(colums.keys()))
        self.rows_list = []  # Initializing the list to store rows
        self.out_path = out_path

    def add_row(self, data: InterData) -> None:
        # Adding the row as a dictionary to the list
        self.rows_list.append(data.dict())

    def finalize_dataset(self) -> None:
        # Converting the list of dictionaries to a DataFrame
        self.dataset = pd.DataFrame(self.rows_list)
        self.rows_list = []  # Clearing the list to release memory

    def get_convo_id(self) -> int:
        if len(self.rows_list) == 0:
            return int(0)
        id = self.rows_list[-1].get(self.conID_col_name)
        if id is None:
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

    def _split_by_col(
        self, col: str, test_ratio: float = 0.2
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        unique_values = self.dataset[col].unique()

        # Separate the dataset for each unique value in the column
        datasets = [self.dataset[self.dataset[col] == value] for value in unique_values]

        # Split each of the separated datasets into train and test sets
        train_test_sets = [
            train_test_split(dataset, test_size=test_ratio) for dataset in datasets
        ]

        # Concatenate the train sets and the test sets separately
        train_data = pd.concat([train_set for train_set, test_set in train_test_sets])
        test_data = pd.concat([test_set for train_set, test_set in train_test_sets])

        return train_data, test_data

    def _split_dataset(
        self, test_ratio: float = 0.2, disregard_conversations: bool = False
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        if disregard_conversations:
            # Split dataset into train and test set
            train_data, test_data = train_test_split(self.dataset, test_size=test_ratio)
            return train_data, test_data
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

    def save_dataframe(
        self,
        shuffle: bool,
        split: bool,
        split_col: str | None = None,
        disregard_conversations: bool = False,
    ) -> None:
        if (self.dataset is None) or (self.dataset.empty):
            raise Exception(
                "No data to save. Call the finalize_dataset() method before saving."
            )
        self.check_folder(self.out_path)
        if shuffle:
            if not disregard_conversations:
                self._shuffle_conversations()
        if split:
            if split_col is not None:
                train_data, test_data = self._split_by_col(split_col)
                print(
                    f"label distribution in train:\n{train_data.groupby(split_col).count()}"
                )
                print(
                    f"label distribution in test:\n{test_data.groupby(split_col).count()}"
                )
                if disregard_conversations:
                    train_data = self._shuffle(train_data)
                    test_data = self._shuffle(test_data)
            else:
                # Optionally perform train-test split before saving
                train_data, test_data = self._split_dataset(
                    disregard_conversations=disregard_conversations
                )
            train_data.to_parquet(
                os.path.join(self.out_path, f"train_.parquet"),
                index=False,
            )
            test_data.to_parquet(
                os.path.join(self.out_path, f"test_.parquet"),
                index=False,
            )
        else:
            self.dataset.to_parquet(
                os.path.join(self.out_path, f"inter.parquet"), index=False
            )

    def check_folder(self, path: str) -> None:
        if not os.path.exists(path):
            os.makedirs(path)

    def _shuffle(self, dataset: pd.DataFrame) -> pd.DataFrame:
        return dataset.sample(frac=1).reset_index(drop=True)


if __name__ == "__main__":
    print("This is script is supposed to be run as a module from other scripts.")
