import os
import regex
from tqdm import tqdm
from typing import List

from tools.parquet_processor import ParquetProcessor
from src_py.utils import get_timestamp, InterData, Mood

# TOOL SETTINGS #################################################
IN_GUTENBERG = os.path.join("resources_dev", "data_origin", "gutenberg")
OUT_PATH = os.path.join("resources_dev", "data_sets", "novelist-dev-parquet")
#################################################################


def main():
    filepaths = get_txt_in_directory(IN_GUTENBERG)
    files = []

    # for path in filepaths:
    #     files.append(read_file_as_string(path))

    # create small dev dataset
    for i in range(0, 10):
        files.append(read_file_as_string(filepaths[i]))

    print(f"Found {len(files)} files.")

    for file in files:
        file = remove_header(file)
        file = remove_footer(file)

    pp = ParquetProcessor(out_path=OUT_PATH)
    extract_conversations(files, pp, 3)
    pp.finalize_dataset()
    print("Preview:\n", pp.get_preview(20))
    pp.save_dataframe(shuffle=True, split=True)


def get_txt_in_directory(directory_path):
    "Returns a list of txt files in a directory."
    try:
        files = [
            os.path.join(directory_path, file)
            for file in os.listdir(directory_path)
            if file.endswith(".txt")
        ]
        return files
    except FileNotFoundError:
        print(f"Error: Directory '{directory_path}' not found.")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []


def read_file_as_string(file_path):
    "Opens a text file as a string."
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            file_contents = file.read()
        return file_contents
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return ""
    except Exception as e:
        print(f"Error: {e}")
        return ""


def remove_footer(text):
    """
    Looks for the footer and removes everything after it (including the footer).
    """
    pattern = regex.compile(r"(?im)end of( the)?( this)? project gutenberg")
    lines = text.splitlines()

    # Look for the specified strings
    for index, line in enumerate(lines):
        if pattern.search(line):
            # Delete everything after and including the line containing the target text
            lines = lines[:index]
            break

    return "\n".join(lines)


def remove_header(text):
    """
    Looks for the header and removes everything before it (including the header).
    """
    pattern = regex.compile(r"(?im)start of( the)?( this)? project gutenberg")
    lines = text.splitlines()

    # Look for the specified strings
    for index, line in enumerate(lines):
        if pattern.search(line):
            # Delete everything before and including the line containing the target text
            lines = lines[index + 1 :]
            break

    return "\n".join(lines)


def filter_non_characters(context: str):
    # replace new line characters with a space
    context = context.replace("\n", " ")
    # remove the text between brackets
    context = regex.sub(r"(?:\[|\(|\{|\<)(.*?)(?:\]|\)|\}|\>)", "", context)
    # replace these special \characters with a space
    context = regex.sub(r"(?:\*|\#|\-|\—|\_|\=|\+|\~|\^|\:|\;|\/|\\)", " ", context)
    # remove multiple spaces
    context = regex.sub(r"\s{2,}", " ", context)
    # remove the comma at the end of the sentence
    context = regex.sub(r"(?=.*),$", "", context)
    # strip()
    context = context.strip()
    return context


def find_dialogue(text: str) -> tuple[List[str], List[str]]:
    dialogue_pattern = regex.compile(r"(?<=^|\s)(?:\"|\“)(.*?)(?:\"|\”)", regex.DOTALL)
    raw = dialogue_pattern.findall(text)
    dialogues = list(raw)

    # if the following dialogue starts lower case, join it to the previous one
    for index, dialogue in enumerate(dialogues):
        if index > 0 and dialogue[0].islower():
            dialogues[index - 1] += " " + dialogue

    # remove the dialogues that start with a lower case
    dialogues = [dialogue for dialogue in dialogues if not dialogue[0].islower()]

    return raw, dialogues


def find_context(
    text: str, prior_dialogue: str, num_paragraphs=1, num_sentences=2
) -> str:
    """
    Finds num_paragraphs that precede the prior_dialogue in the text.
    Only returns complete sentences.
    """

    # Splitting the text into paragraphs
    paragraphs = regex.split(r"(?:\n|\\n){2,}", text)

    # Finding the index of the paragraph containing the prior_dialogue
    index_of_prior_dialogue = -1
    for idx, paragraph in enumerate(paragraphs):
        if prior_dialogue in paragraph:
            index_of_prior_dialogue = idx
            break

    # If prior_dialogue is not found, return an empty string
    if index_of_prior_dialogue == -1:
        # print(f"Error: Prior dialogue '{prior_dialogue}' not found.")
        return ""

    # Extracting the preceding paragraphs
    start_index = max(0, index_of_prior_dialogue - num_paragraphs)
    preceding_paragraphs = paragraphs[start_index:index_of_prior_dialogue]

    # extract the last n sentences from the preceding paragraphs
    for idx, paragraph in enumerate(preceding_paragraphs):
        sentences = regex.split(
            r"(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s", paragraph
        )
        preceding_paragraphs[idx] = " ".join(sentences[-num_sentences:])

    # if the sentences dont end with a period discard the context
    if not all(
        [
            paragraph.endswith(".")
            or paragraph.endswith("?")
            or paragraph.endswith("!")
            for paragraph in preceding_paragraphs
        ]
    ):
        return ""

    # Joining the paragraphs into a single string
    return " ".join(preceding_paragraphs)


def create_inter_data(
    conID: int, context: str, conversation: List[str], always_context: bool = False
) -> List[InterData]:
    """
    Creates a list of InterData objects from a conversation.
    """
    inter_data = []
    for i, j in zip(
        range(0, len(conversation) - 1, 1), range(0, len(conversation) - 1, 2)
    ):
        input_dialogue = conversation[j]
        response_dialogue = conversation[j + 1]
        if i == 0 or always_context:
            context = context
        else:
            context = ""
        inter_data.append(
            InterData(
                timestamp=get_timestamp(),
                conID=conID,
                msgID=i,
                context=context,
                input=input_dialogue,
                response=response_dialogue,
                mood=Mood.doubt,
                trust=0.5,
                epoch_cls=0,
                epoch_gen=0,
            )
        )
    return inter_data


def extract_conversations(
    files: List[str], parproc: ParquetProcessor, min_words=1, min_turns=2
) -> None:
    for file in tqdm(files, total=len(files)):
        # Splitting text into contexts (paragraphs)
        candidates = regex.split(r"(\n{3,})|(\* +\* +\* +\* +\** *\n)", file)

        for candidate in candidates:
            if candidate is None:
                continue

            raw, dialogues = find_dialogue(candidate)
            if len(dialogues) < 1:
                continue

            context = find_context(candidate, raw[0])
            context = filter_non_characters(context)
            dialogues = [filter_non_characters(dialogue) for dialogue in dialogues]

            valid_dialogues = []

            # only keep dialogues with more than min_words
            for dialogue in dialogues:
                if len(dialogue.split()) >= min_words:
                    valid_dialogues.append(dialogue)

            # discard emtpy dialogues
            if len(valid_dialogues) < min_turns:
                continue

            conID = parproc.get_convo_id()
            inter_data = create_inter_data(conID, context, valid_dialogues, True)

            for x in inter_data:
                parproc.add_row(x)


if __name__ == "__main__":
    main()
