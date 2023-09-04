# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import random
from typing import List

from datasets import Dataset, DatasetDict, disable_caching, concatenate_datasets

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
    """Simplified version disregarding splits and convoIDs for Ars Electronica"""

    # Paths
    active_path: str
    nli_path: str

    # Data
    nli_database: Dataset
    input_database: Dataset

    def __init__(self) -> None:
        disable_caching()
        self._setup_paths()
        self._load_database()

    # PUBLIC METHODS  ###########################################################
    def get_message(self, conID: int) -> List[ConvoText]:
        """
        Returns the ConvoText datapoint with reversed indices of the given conID.
        """
        datapoint = self.input_database[-conID]
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

    def create_datapoint(self, input: ConvoText) -> InterData:
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

    def add(self, datapoint: InterData) -> None:
        """Adds a datapoint to the database."""
        self.input_database = self.input_database.add_item(datapoint.dict())  # type: ignore
        if config.DEBUG_MSG:
            print(f"Added datapoint to database:\n{self.input_database[-1]}")

    def save(self) -> None:
        # save to disk
        path = os.path.join(
            get_resource_path(), *config.INPUT_DATA_PATH, get_timestamp()
        )
        self.input_database.save_to_disk(path)
        if config.DEBUG_MSG:
            print("Database saved to:", path)

    def get_cls_data(self) -> DatasetDict:
        """
        Returns a DatasetDict containing all entries with the minimal epoch_cls value.
        """
        # merge datasets to train_database
        train_database = concatenate_datasets([self.nli_database, self.input_database])
        train_indices = random.sample(range(len(train_database)), config.CLS_EPOCH_SIZE)
        test_indices = random.sample(
            range(len(train_database)), int(config.CLS_EPOCH_SIZE * 0.2)
        )
        cls_train = train_database.select(train_indices)
        cls_test = train_database.select(test_indices)
        cls_train = cls_train.shuffle()
        cls_epoch = DatasetDict({"train": cls_train, "test": cls_test})
        return cls_epoch

    # END PUBLIC METHODS #######################################################

    # PRIVATE METHODS ##########################################################
    def _setup_paths(self) -> None:
        # check if data folder exists
        data_path = os.path.join(get_resource_path(), *config.INPUT_DATA_PATH)
        if not os.path.exists(data_path):
            raise Exception(f"{data_path} not found. Please contact the developer.")

        # check if base folder exists
        fallback_path = os.path.join(data_path, config.INPUT_PROTECTED_SUB)
        if not os.path.exists(fallback_path):
            raise Exception(f"{fallback_path} not found. Please contact the developer.")

        # check if nli folder exists
        self.nli_path = os.path.join(get_resource_path(), *config.NLI_DATA_PATH)
        if not os.path.exists(self.nli_path):
            raise Exception(f"{self.nli_path} not found. Please contact the developer.")

        # look for subfolders
        subfoldernames = os.listdir(data_path)
        subfolders = []
        for name in subfoldernames:
            subfolders.append(os.path.join(data_path, name))

        if len(subfolders) <= 1:
            self.active_path = os.path.join(data_path, get_timestamp())
            os.mkdir(self.active_path)
        else:
            # get most recent subfolder
            subfolders.sort(key=lambda x: os.path.getmtime(x))
            self.active_path = subfolders[-1]  # last element is the most recent

    def _load_database(self) -> None:
        # load nli dataset
        self.nli_database = Dataset.load_from_disk(self.nli_path)

        # load input dataset
        try:
            self.input_database = Dataset.load_from_disk(self.active_path)
            path = self.active_path
        except:
            try:
                print("except")
                path = os.path.join(
                    get_resource_path(),
                    *config.INPUT_DATA_PATH,
                    config.INPUT_PROTECTED_SUB,
                )
                self.input_database = Dataset.load_from_disk(path)
            except Exception as e:
                raise Exception(
                    "The base datapath was moved or deleted. Please contact the developer.\nError: "
                    + str(e)
                )

        if config.DEBUG_MSG:
            print("nli_database loaded from:", self.nli_path)
            print("input_database loaded from:", path)

        self._cleanup_datapath()

    def _cleanup_datapath(self) -> None:
        folders = 0
        subfoldernames = os.listdir(self.active_path)
        subfolders = []
        for name in subfoldernames:
            if name == config.INPUT_PROTECTED_SUB:
                continue
            subfolders.append(os.path.join(self.active_path, name))

        subfolders.sort(key=lambda x: os.path.getmtime(x))

        if len(subfolders) > config.MAX_DATA_FOLDERS:
            for folder in subfolders[: -config.MAX_DATA_FOLDERS]:
                remove_folder(os.path.join(self.active_path, folder))
                folders += 1

        if config.DEBUG_MSG:
            print(f"Data folder cleanup complete.\nRemoved {folders} folders.")

    # END PRIVATE METHODS ######################################################
