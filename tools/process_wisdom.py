import os
import pandas as pd
from src_py.utils import Mood, InterData, get_timestamp
from tools.parquet_processor import ParquetProcessor
import tools.__tools_config as cfg
from tqdm import tqdm


def main():
    # Load Processor
    print(cfg.OUT_PATH_WISDOM)
    pp = ParquetProcessor(cfg.OUT_PATH_WISDOM)

    europal = pd.read_parquet(cfg.IN_PATH_RAW_EUROPARL)  # -> filtered langs, no english
    fever = pd.read_json(
        os.path.join(cfg.IN_PATH_RAW_FEVER, "train_fitems.jsonl"), lines=True
    )

    # delete all columns except "query" and "label"
    fever.drop(["cid", "fid", "verifiable"], axis=1, inplace=True)

    # rename columns
    fever.rename(columns={"query": "input", "label": "mood"}, inplace=True)

    # remap mood values
    fever["mood"] = fever["mood"].map(
        {
            "SUPPORTS": str(Mood.truth),
            "REFUTES": str(Mood.lie),
            "NOT ENOUGH INFO": str(Mood.doubt),
        }
    )

    # get 34200 entries (1800 * 18 (europarl) + 1800 (random keystrokes)) randomly for each mood
    fever_select = (
        fever.groupby("mood").apply(lambda x: x.sample(n=34200)).reset_index(drop=True)
    )

    # rename colums
    europal.rename(columns={"language": "mood", "text": "input"}, inplace=True)

    # put "input" column first
    europal = europal[["input", "mood"]]

    # get 1800 (*18 -> 32400) entries randomly for each mood
    europal_select = (
        europal.groupby("mood").apply(lambda x: x.sample(n=1800)).reset_index(drop=True)
    )

    # set all moods to "forlang"
    europal_select["mood"] = str(Mood.forlang)

    # create random keystrokes
    rand_keystrokes_df = pd.DataFrame(
        {"input": [random_keystrokes() for _ in range(1800)], "mood": str(Mood.forlang)}
    )

    forlang_df = pd.concat([europal_select, rand_keystrokes_df], ignore_index=True)
    all_df = pd.concat([fever_select, forlang_df], ignore_index=True)

    print(all_df.head())
    print(all_df.shape)
    print(all_df.groupby("mood").count())

    for entry in tqdm(all_df.itertuples(), total=len(all_df)):
        # tqdm progress bar
        data = InterData(
            timestamp=get_timestamp(),
            conID=0,
            msgID=0,
            mood=Mood.from_string(entry.mood),
            context=entry.context if entry.context else "",
            input=entry.input,
            response="",
        )
        pp.add_row(data)

    pp.finalize_dataset()
    pp.save_dataframe(True, True, True)


# create random keystrokes
import random
import string


def random_keystrokes() -> str:
    # Choose a random length between 40 and 120 characters
    rand_length = random.randint(40, 120)

    # Create a random string of the chosen length
    rand_str = "".join(
        random.choice(
            string.ascii_letters
            + string.ascii_letters
            + string.ascii_letters
            + string.ascii_letters
            + string.digits
            + string.punctuation
            + " "
        )
        for _ in range(rand_length)
    )

    return rand_str


if __name__ == "__main__":
    main()
