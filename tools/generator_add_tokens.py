# idea -> https://medium.com/huggingface/how-to-build-a-state-of-the-art-conversational-ai-with-transfer-learning-2d818ac26313
import os
from transformers import GPTNeoXForCausalLM, GPTNeoXTokenizerFast
from typing import List
from src_py.utils import SpecialTokens

# TOOL SETTINGS #################################################
IN_MODEL = os.path.join("resources_dev", "models_origin", "pythia-1b-deduped")
OUT_MODEL = os.path.join("resources_dev", "models_tuned", "pythia-tok-mod")
#################################################################

tokenizer: GPTNeoXTokenizerFast = GPTNeoXTokenizerFast.from_pretrained(IN_MODEL)
model: GPTNeoXForCausalLM = GPTNeoXForCausalLM.from_pretrained(IN_MODEL)  # type: ignore

# Mod Overview:
# - <|endoftext|> to indicate the end of the sequence -> already in tokenizer.json
# - <|padding|> as a padding token to build batches of sequences -> already in tokenizer.json

# - <|input|> to indicate user input
# - <|response|> to indicate the response

# - <|begoftext|> to indicate the start of the sequence # XXX not sure if this is needed
# - <|unktoken|> to indicate unknown tokens # XXX not sure if this is needed

SPECIAL_TOKENS_LIST: List = [
    SpecialTokens.context,
    SpecialTokens.input,
    SpecialTokens.response,
    SpecialTokens.greet,
]
SPECIAL_TOKENS_DICT: dict = {"additional_special_tokens": SPECIAL_TOKENS_LIST}

# Add the special tokens to the tokenizer
orig_num_tokens = model.resize_token_embeddings().num_embeddings
print(f"Original number of tokens: {orig_num_tokens}")
# num_added_tokens = tokenizer.add_tokens(SPECIAL_TOKENS_LIST, special_tokens=True)
num_added_tokens = tokenizer.add_special_tokens(SPECIAL_TOKENS_DICT)
print(f"Number of added tokens: {num_added_tokens}")
if num_added_tokens > 0:
    model.resize_token_embeddings(new_num_tokens=orig_num_tokens + num_added_tokens)
print(f"New number of tokens: {model.resize_token_embeddings().num_embeddings}")

# Save the modified tokenizer and model
tokenizer.save_pretrained(OUT_MODEL)
model.save_pretrained(OUT_MODEL)
print(f"Saved modified tokenizer and model to {OUT_MODEL}")
