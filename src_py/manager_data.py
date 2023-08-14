# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import random
from typing import List

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
    def get_message(self, conID: int) -> List[ConvoText]:
        """
        Returns the ConvoText object with the given msgID.
        """
        print("get_message", conID)
        sorted = self.database.sort("conID")
        highest_train_datapoint = sorted["train"][-conID]
        highest_test_datapoint = sorted["test"][-conID]
        if highest_train_datapoint["conID"] > highest_test_datapoint["conID"]:
            datapoint = highest_train_datapoint
        else:
            datapoint = highest_test_datapoint

        interdata = InterData(**datapoint)
        input = ConvoText(
            timestamp=interdata.timestamp,
            convoID=interdata.conID,
            messageID=interdata.msgID,
            type=ConvoText.ConvoType.input,
            text=interdata.input,
            trust=interdata.trust,
        )
        response = ConvoText(
            timestamp=interdata.timestamp,
            convoID=interdata.conID,
            messageID=interdata.msgID,
            type=ConvoText.ConvoType.response,
            text=interdata.response,
            trust=interdata.trust,
        )
        return [input, response]

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
        # XXX Could not get that to work using random indices instead
        # # get minimal epoch_cls value in database
        # min_epoch = min(self.database["train"]["epoch_cls"])
        # # get indices of all entries with minimal epoch_cls value
        # indices = [
        #     idx
        #     for idx, epoch in enumerate(self.database["train"]["epoch_cls"])
        #     if epoch == min_epoch
        # ]
        # # get all entries with minimal epoch_cls value
        # cls_train = self.database["train"].select(indices)

        # # Add 1 to epoch_cls value of all entries in indices
        # def advance_epoch_cls(batch, idx):
        #     for i in range(len(batch["epoch_cls"])):
        #         if [idx[i]] in indices:
        #             batch["epoch_cls"][i] += 1
        #     return batch

        # self.database["train"] = self.database["train"].map(
        #     advance_epoch_cls, with_indices=True, batched=True
        # )

        # print(
        #     self.database["train"].filter(
        #         lambda example: example["epoch_cls"] == min_epoch + 1  # type: ignore
        #     )
        # )

        # print(
        #     self.database["train"].filter(
        #         lambda example: example["epoch_cls"] == min_epoch + 1  # type: ignore
        #     )["epoch_cls"][0:10]
        # )

        train_indices = random.sample(
            range(len(self.database["train"])), config.CLS_EPOCH_SIZE
        )
        test_indices = random.sample(
            range(len(self.database["test"])), int(config.CLS_EPOCH_SIZE * 0.2)
        )
        cls_train = self.database["train"].select(train_indices)
        cls_test = self.database["test"].select(test_indices)
        cls_train = cls_train.shuffle()
        cls_epoch = DatasetDict({"train": cls_train, "test": cls_test})
        return cls_epoch

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
