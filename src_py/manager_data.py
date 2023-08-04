# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import random
from datasets import DatasetDict, disable_caching
from collections import deque
from typing import List

# Local Imports
from . import __backend_config as config
from .utils import (
    get_resource_path,
    get_timestamp,
    SpecialTokens,
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
    epoch_session: deque[list[int]]

    def __init__(self) -> None:
        disable_caching()
        self._setup_paths()
        self._load_database()
        self._update_epoch_session()

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
            epoch_cls=0,
            epoch_gen=0,
        )
        return datapoint

    def get_split(self) -> str:
        # XXX: Has to be updated if more splits are added
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

    def get_gen_step(self, random_range: bool = False) -> str:
        # get all rows for the conID with the lowest epoch_gen
        # min_epoch_gen = min(self.database["train"]["epoch_gen"])
        # candidates = self.database["train"].filter(
        #     lambda x: x["epoch_gen"] == min_epoch_gen
        # )
        # max_conID = max(self.epoch_session)
        # conversation = candidates.filter(lambda x: x["conID"] == max_conID)
        # print(*conversation)
        start_index = 136789  # self.epoch_session[0][0]
        end_index = 136798  # self.epoch_session[0][1]
        index_range = end_index - start_index

        if random_range:
            shift = random.randint(0, index_range - 1)
            index_range = random.randint(1, index_range - shift)
            start_index = start_index + shift
            end_index = start_index + index_range
            print(
                f"shift: {shift}, index_range: {index_range}, start_index: {start_index}, end_index: {end_index}"
            )

        convo_subset = self.database["train"][start_index:end_index]

        inter_data = []
        for i in range(index_range):
            data = {key: value[i] for key, value in convo_subset.items()}
            instance = InterData(**data)
            inter_data.append(instance)

        print(inter_data)

        step = self._get_gen_training_str(inter_data)
        return step

    def get_cls_step(self) -> str:
        return ""

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
                    "Something went really wrong. Please contact the developer.\nError: "
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

    def _update_epoch_session(self) -> None:
        pass

    def _get_gen_training_str(self, conversation: List[InterData]) -> str:
        # create history from input and responses in conversation list
        context = conversation[0].context
        history = ""
        for i in range(len(conversation)):
            history += SpecialTokens.input + conversation[i].input
            history += SpecialTokens.response + conversation[i].response

        # create training string
        training_str = SpecialTokens.context + context + history + SpecialTokens.endseq
        return training_str

    # def _valid_data(self, data: InterData) -> bool:
    #     if data.mood == Mood.doubt:
    #         options = [True, False]
    #         choice = random.choices(options, weights=[0.2, 0.8], k=1)[0]
    #         if config.DEBUG_MSG:
    #             print(f"Data is doubted, weighted random chose: {choice}")
    #         return choice
    #     if data.mood == Mood.neutral:
    #         options = [True, False]
    #         choice = random.choices(options, weights=[0.8, 0.2], k=1)[0]
    #         if config.DEBUG_MSG:
    #             print(f"Data is neutral, weighted random chose: {choice}")
    #         return choice
    #     if data.mood == Mood.truth:
    #         if config.DEBUG_MSG:
    #             print(f"Data identified as truth, returning True")
    #         return True
    #     if config.DEBUG_MSG:
    #         print(f"Data identified as lie, returning False")
    #     return False

    # END PRIVATE METHODS ######################################################
