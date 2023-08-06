import os
from transformers import GPTNeoXForCausalLM, GPTNeoXTokenizerFast

from src_py.manager_data import DataManager
from src_py.utils import get_cuda

# TOOL SETTINGS #################################################
IN_MODEL = os.path.join("resources_dev", "models_tuned", "pythia-tok-mod")
IN_DATA = os.path.join("resources_dev", "data_sets", "novelist")
OUT_MODEL = os.path.join("resources_dev", "models_tuned", "inter-generator")
#################################################################


def main() -> None:
    d_man = DataManager()
    # device = get_cuda()

    # model = GPTNeoXForCausalLM.from_pretrained(IN_MODEL).to(device)  # type: ignore
    # tokenizer = GPTNeoXTokenizerFast.from_pretrained(IN_MODEL)

    # def preprocess_data():
    #     return tokenizer(str, return_tensors="pt").input_ids

    # preprocess_data()


if __name__ == "__main__":
    main()
