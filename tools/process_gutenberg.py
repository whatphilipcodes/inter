import os
import regex
from typing import List

import tools.__tools_config as cfg
from tools.classes.parquet_processor import ParquetProcessor
from src_py.utils import get_timestamp, InterData, Mood

FILE = "The War of the Worlds by H. G. Wells"


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
    lines = text.splitlines()

    # Look for the specified strings
    for index, line in enumerate(lines):
        if (
            "END OF THE PROJECT GUTENBERG EBOOK" in line.upper()
            or "End of the Project Gutenberg EBook" in line.upper()
        ):
            # Find the last non-empty line preceding the target text
            for preceding_index in range(index - 1, -1, -1):
                if lines[preceding_index].strip():
                    break

                # Remove everything from the last non-empty line onward
                lines = lines[: preceding_index + 1]
                break

    # Join the remaining lines to create the modified text
    modified_text = "\n".join(lines)
    return modified_text


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


def find_dialogue(text) -> tuple[List[str], List[str]]:
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


def find_context(text: str, prior_dialogue: str, num_paragraphs=1) -> str:
    """
    Finds num_paragraphs that precede the prior_dialogue in the text.
    Only returns complete sentences.
    """

    # Splitting the text into paragraphs
    paragraphs = text.split("\n\n")

    # Finding the index of the paragraph containing the prior_dialogue
    index_of_prior_dialogue = -1
    for idx, paragraph in enumerate(paragraphs):
        if prior_dialogue in paragraph:
            index_of_prior_dialogue = idx
            break

    # If prior_dialogue is not found, return an empty string
    if index_of_prior_dialogue == -1:
        print(f"Error: Prior dialogue '{prior_dialogue}' not found.")
        return ""

    # Extracting the preceding paragraphs
    start_index = max(0, index_of_prior_dialogue - num_paragraphs)
    preceding_paragraphs = paragraphs[start_index:index_of_prior_dialogue]

    # Joining the paragraphs into a single string
    return "\n\n".join(preceding_paragraphs)


def create_inter_data(
    conID: int, context: str, conversation: List[str]
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
        if i == 0:
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
                mood=Mood.neutral,
            )
        )
    return inter_data


def extract_conversations(
    text, parproc: ParquetProcessor, min_words=1, min_turns=2
) -> None:
    conversations = []

    # Splitting text into contexts (paragraphs)
    candidates = regex.split(r"(?:\n){3,}", text)
    print(f"Number of possible candidates: {len(candidates)}")

    for candidate in candidates:
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
        inter_data = create_inter_data(conID, context, valid_dialogues)

        for x in inter_data:
            parproc.add_row(x)

    print(f"Number of extracted conversations: {len(conversations)}")


def main():
    file = read_file_as_string(os.path.join(cfg.IN_PATH_RAW_GENERATOR, FILE + ".txt"))
    file = remove_footer(file)
    #
    pp = ParquetProcessor()
    extract_conversations(file, pp)
    print(pp.get_preview(20))
    pp.save_dataframe("vintage-novelist", shuffle=True, split=True)


if __name__ == "__main__":
    main()
