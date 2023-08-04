# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import torch
from typing import Any
from transformers import DebertaV2Tokenizer, DebertaV2ForSequenceClassification

# Local Imports
from . import __backend_config as config
from .utils import get_resource_path, get_cuda, ClassifierLabels, Mood

# END IMPORT BLOCK ###########################################################


class Classifier:
    def __init__(self):
        # File paths
        self.modelpath = os.path.join(get_resource_path(), *config.CLS_PATH)
        # self.datapath = os.path.join(
        #     get_resource_path(), "data_raw", "classifier", dataroot
        # )

        # Load infrastructure
        self.device = get_cuda()
        self.model = DebertaV2ForSequenceClassification.from_pretrained(
            self.modelpath, num_labels=len(ClassifierLabels.dict)
        ).to(  # type: ignore
            self.device
        )
        self.tokenizer = DebertaV2Tokenizer.from_pretrained(self.modelpath)

    def infer(self, text: str):
        # Set model to eval mode
        self.model.eval()

        # Get input text and tokenize
        inputs = self.tokenizer(text, return_tensors="pt")
        inputs.to(self.device)

        # Run inference
        with torch.no_grad():
            logits = self.model(**inputs).logits

        # Get predicted class
        predicted_class_id = logits.argmax().item()

        # Decode and return
        return self.translate_to_mood(predicted_class_id)

    def translate_to_mood(self, num_cls: Any) -> Mood:
        cls_label = ClassifierLabels.dict.inverse[num_cls]
        mood = Mood(cls_label)
        if config.DEBUG_MSG:
            print(f"Predicted LABEL_ID {num_cls} -> {mood}")
        return mood
