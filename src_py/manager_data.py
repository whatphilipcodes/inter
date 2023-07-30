# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import torch

from torch.utils.data import DataLoader
from tqdm.auto import tqdm

from transformers import DataCollatorWithPadding, get_scheduler, SchedulerType
from datasets import (
    load_dataset,
    DatasetDict,
    Dataset,
    IterableDatasetDict,
    IterableDataset,
)

# Local Imports
from .utils import get_resource_path, get_cuda, ConvoText, GenData, ClsData

# END IMPORT BLOCK ###########################################################


class DataManger:
    def __init__(self) -> None:
        pass

    # Public Methods ###########################################################
    def add(self, datapoint: ConvoText) -> None:
        pass

    def save(self) -> None:
        pass

    def get_gen_step(self) -> GenData:
        return GenData()

    def get_cls_step(self) -> ClsData:
        return ClsData()

    # END PUBLIC METHODS #######################################################

    # PRIVATE METHODS ##########################################################
    def _load(self) -> None:
        pass

    # END PRIVATE METHODS ######################################################
