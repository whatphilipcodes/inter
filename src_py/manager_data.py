# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import random
from datasets import DatasetDict, disable_caching

# Local Imports
from . import __backend_config as config
from .utils import (
    get_resource_path,
    get_timestamp,
    ConvoText,
    InterData,
    Mood,
    remove_folder,
)

# END IMPORT BLOCK ###########################################################


class DataManager:
    # Paths
    data_path: str
    active_path: str
    fallback_path: str

    # Data
    database: DatasetDict

    def __init__(self) -> None:
        disable_caching()
        self._setup_paths()
        self._load_database()

    # PUBLIC METHODS  ###########################################################
    def get_datapoint(self, input: ConvoText) -> InterData:
        datapoint = InterData(
            timestamp=input.timestamp,
            conID=input.convoID,
            msgID=input.messageID,
            context="",
            input=input.text,
            response="",
            mood=Mood.doubt,
            trust=input.trust,
            epoch_cls=0,
            epoch_gen=0,
        )
        return datapoint

    def get_split(self) -> str:
        split_probabilities = {
            "train": 0.8,
            "test": 0.2,
            # Add other splits and their probabilities here if available
        }

        # Normalize probabilities to ensure they sum up to 1
        total_probability = sum(split_probabilities.values())
        normalized_probabilities = {
            split: prob / total_probability
            for split, prob in split_probabilities.items()
        }

        # Get the names of all splits
        all_splits = list(normalized_probabilities.keys())

        # Use random.choices to select a split based on the given weights
        selected_split = random.choices(
            all_splits, weights=list(normalized_probabilities.values()), k=1
        )[0]

        return selected_split

    def add(self, datapoint: InterData, split: str) -> None:
        self.database[split] = self.database[split].add_item(datapoint.dict())  # type: ignore
        if config.DEBUG_MSG:
            print(f"Added datapoint to split {split}:\n{self.database[split][-1]}")

        # TODO: For every datapoint added, remove the oldest datapoint from the same split

    def save(self) -> None:
        # save to disk
        path = os.path.join(self.data_path, get_timestamp())
        self.database.save_to_disk(path)
        if config.DEBUG_MSG:
            print("Database saved to:", path)

    # def get_gen_data(self) -> DatasetDict:
    #     gen_train = self.database["train"].sort("epoch_gen")
    #     gen_test = self.database["test"]
    #     gen_queue = DatasetDict({"train": gen_train, "test": gen_test})
    #     return gen_queue

    def get_cls_data(self) -> DatasetDict:
        """
        Returns a DatasetDict containing all entries with the minimal epoch_cls value.
        """
        min_epoch = min(self.database["train"]["epoch_cls"])
        cls_train = self.database["train"].filter(
            lambda example: example["epoch_cls"] == min_epoch
        )
        cls_train = cls_train.shuffle()
        cls_test = self.database["test"]
        cls_queue = DatasetDict({"train": cls_train, "test": cls_test})
        return cls_queue

    # END PUBLIC METHODS #######################################################

    # PRIVATE METHODS ##########################################################
    def _setup_paths(self) -> None:
        # check if data folder exists
        self.data_path = os.path.join(get_resource_path(), *config.DATA_PATH)
        if not os.path.exists(self.data_path):
            raise Exception("Data folder not found. Please contact the developer.")

        # check if base folder exists
        self.fallback_path = os.path.join(self.data_path, "base")
        if not os.path.exists(self.fallback_path):
            raise Exception("Base data folder not found. Please contact the developer.")

        # look for subfolders
        subfoldernames = os.listdir(self.data_path)
        subfolders = []
        for name in subfoldernames:
            subfolders.append(os.path.join(self.data_path, name))

        if len(subfolders) <= 1:
            self.active_path = os.path.join(self.data_path, get_timestamp())
            os.mkdir(self.active_path)
        else:
            # get most recent subfolder
            subfolders.sort(key=lambda x: os.path.getmtime(x))
            self.active_path = subfolders[-1]  # last element is the most recent

    def _load_database(self) -> None:
        path: str
        try:
            self.database = DatasetDict.load_from_disk(self.active_path)
            path = self.active_path
        except:
            try:
                self.database = DatasetDict.load_from_disk(self.fallback_path)
                path = self.fallback_path
            except Exception as e:
                raise Exception(
                    "The base datapath was moved or deleted. Please contact the developer.\nError: "
                    + str(e)
                )

        if config.DEBUG_MSG:
            print("Database loaded from:", path)

        self._cleanup_datapath()

    def _cleanup_datapath(self) -> None:
        folders = 0

        subfoldernames = os.listdir(self.data_path)
        subfolders = []
        for name in subfoldernames:
            if name == config.DATA_SUB_PROTECTED:
                continue
            subfolders.append(os.path.join(self.data_path, name))

        subfolders.sort(key=lambda x: os.path.getmtime(x))

        if len(subfolders) > config.MAX_DATA_FOLDERS:
            for folder in subfolders[: -config.MAX_DATA_FOLDERS]:
                remove_folder(os.path.join(self.data_path, folder))
                folders += 1

        if config.DEBUG_MSG:
            print(f"Data folder cleanup complete.\nRemoved {folders} folders.")

    # END PRIVATE METHODS ######################################################
