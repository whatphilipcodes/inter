# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import random

# import torch

# from torch.utils.data import DataLoader
# from tqdm.auto import tqdm

# from transformers import DataCollatorWithPadding, get_scheduler, SchedulerType
from datasets import DatasetDict, disable_caching

# Local Imports
from . import __backend_config as config
from .utils import get_resource_path, ConvoText, InterData, Mood

# END IMPORT BLOCK ###########################################################


class DataManager:
    # Paths
    active_path: str
    backup_path: str
    fallback_path: str

    # Data
    database: DatasetDict

    def __init__(self) -> None:
        disable_caching()
        self.active_path, self.backup_path, self.fallback_path = self._get_paths()
        self.database = self._load()
        # print(self.database)

    # Public Methods ###########################################################
    def get_datapoint(self, input: ConvoText) -> InterData:
        datapoint = InterData(
            timestamp=input.timestamp,
            conID=input.convoID,
            msgID=input.messageID,
            context="",
            input=input.text,
            response="",
            mood=Mood.neutral,
        )
        return datapoint

    def add(self, datapoint: InterData) -> None:
        self.database["train"] = self.database["train"].add_item(datapoint.dict())  # type: ignore
        if config.DEBUG_MSG:
            print("Added datapoint to database:", self.database["train"][-1])

    def save(self) -> None:
        # switch slots
        self.active_path, self.backup_path = self.backup_path, self.active_path
        self.database.save_to_disk(self.active_path)
        if config.DEBUG_MSG:
            print("Database saved to:", self.active_path)

    # def get_gen_step(self) -> InterData:
    #     pass

    # def get_cls_step(self) -> InterData:
    #     pass

    # END PUBLIC METHODS #######################################################

    # PRIVATE METHODS ##########################################################
    def _get_paths(self) -> tuple[str, str, str]:
        # check if data folder exists
        data_path = os.path.join(get_resource_path(), *config.DATA_PATH)
        if not os.path.exists(data_path):
            os.makedirs(data_path)

        fallback_path = os.path.join(data_path, "base")
        if not os.path.exists(fallback_path):
            os.makedirs(fallback_path)

        # check slots
        slots = [
            os.path.join(data_path, "slot-a"),
            os.path.join(data_path, "slot-b"),
        ]

        for folder in slots:
            if not os.path.exists(folder):
                os.makedirs(folder)

        # get the one used last
        slots.sort(key=lambda x: os.path.getmtime(x))
        backup_path = slots[0]  # first element is the oldest
        active_path = slots[-1]  # last element is the most recent

        if config.DEBUG_MSG:
            print("Loading database from:", active_path)

        return active_path, backup_path, fallback_path

    def _load(self) -> DatasetDict:
        database = None
        try:
            database = DatasetDict.load_from_disk(self.active_path)
        except:
            try:
                database = DatasetDict.load_from_disk(self.fallback_path)
            except Exception as e:
                raise Exception(
                    "Something went really wrong. Please contact the developer.\nError: "
                    + str(e)
                )
        return database

    # END PRIVATE METHODS ######################################################
