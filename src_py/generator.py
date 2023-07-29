# IMPORT BLOCK ###############################################################
# Lib Imports
import os
import torch

from transformers import GPTNeoXForCausalLM, GPTNeoXTokenizerFast

# Local Imports
from . import __backend_config as config
from .utils import get_resource_path, get_cuda

# END IMPORT BLOCK ###########################################################


class Generator:
    """
    Generates text using a finetuned Pythia variant.
    """

    def __init__(
        self,
    ) -> None:
        # File paths
        self.modelpath = os.path.join(get_resource_path(), "models", config.GEN_ROOT)

        # Config XXX ask if this is correct -> see tokenizer.json
        self.eos_token_id = 0
        self.pad_token_id = 1

        # Load infrastructure
        self.device = get_cuda()
        self.model = GPTNeoXForCausalLM.from_pretrained(self.modelpath).to(self.device)  # type: ignore
        self.tokenizer = GPTNeoXTokenizerFast.from_pretrained(self.modelpath)

    def infer(self, input: str) -> str:
        self.model.eval()

        # Get input text and tokenize
        inputs = self.tokenizer(input, return_tensors="pt")
        inputs.to(self.device)

        # Run inference
        with torch.no_grad():
            generated_tokens = self.model.generate(
                **inputs,
                do_sample=True,
                num_beams=5,
                # num_beam_groups=5,
                # diversity_penalty=1.0,
                # temperature=0.8,
                max_new_tokens=100,
                min_length=40,
                no_repeat_ngram_size=2,
                # early_stopping=True,
                # top_k=50,
                # top_p=0.95,
                eos_token_id=self.eos_token_id,
                pad_token_id=self.pad_token_id,
            )

        raw = self.tokenizer.decode(generated_tokens[0], skip_special_tokens=False)
        processed = self.postprocess(raw)

        # Decode and return the generated text
        return processed

    def postprocess(self, text: str) -> str:
        """
        Post-process the generated text to ensure it ends with a complete sentence.

        This method checks if the text ends with a sentence-ending punctuation mark (".", "!", "?").
        If it doesn't, the method finds the last occurrence of a sentence-ending punctuation mark
        and truncates the text at that position.

        Args:
            text (str): The generated text to be post-processed.

        Returns:
            str: The post-processed text, which should end with a complete sentence.
        """
        if not text.endswith((".", "!", "?")):
            # Find the last occurrence of a sentence-ending punctuation mark
            end_position = max(text.rfind("."), text.rfind("!"), text.rfind("?"))
            if end_position != -1:
                text = text[: end_position + 1]

        return text.strip()
