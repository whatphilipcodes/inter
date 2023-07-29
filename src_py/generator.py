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
        # if config.DEBUG_MSG:
        #     print(f"Input tokens:\n {inputs}")
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
        if config.DEBUG_MSG:
            print(f"Raw result:\n {raw}")

        # Decode and return the generated text
        return raw
