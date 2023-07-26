# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import torch

from torch.utils.data import DataLoader
from tqdm.auto import tqdm

from transformers import  DataCollatorWithPadding, get_scheduler, SchedulerType
from datasets import load_dataset, DatasetDict, Dataset, IterableDatasetDict, IterableDataset
import evaluate

# Local Imports
from .utils import get_resource_path, get_cuda
# END IMPORT BLOCK ###########################################################

class InterDataCollator:

    def __init__(self) -> None:
        pass