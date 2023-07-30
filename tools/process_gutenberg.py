import os
import regex
from src_py.utils import get_resource_path

FILE = "The Time Machine by H. G. Wells"
INPATH = os.path.join(get_resource_path(), "data_raw", "generator")
OUTPATH = os.path.join(get_resource_path(), "data_raw", "to-delete")


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
    return context


def find_dialogue(text):
    dialogue_pattern = regex.compile(r"(?<=^|\s)(?:\"|\“)(.*?)(?:\"|\”)", regex.DOTALL)
    dialogues = dialogue_pattern.findall(text)

    # if the following dialogue starts lower case, join it to the previous one
    for index, dialogue in enumerate(dialogues):
        if index > 0 and dialogue[0].islower():
            dialogues[index - 1] += " " + dialogue

    # remove the dialogues that start with a lower case
    dialogues = [dialogue for dialogue in dialogues if not dialogue[0].islower()]

    return dialogues


def extract_conversations(text, min_words=2, min_turns=2):
    conversations = []

    # Splitting text into contexts (paragraphs)
    contexts = regex.split(r"(?:\n){3,}", text)

    for context in contexts:
        dialogues = find_dialogue(context)
        dialogues = [filter_non_characters(dialogue) for dialogue in dialogues]
        dialogues = [dialogue.strip() for dialogue in dialogues]

        valid_dialogues = []

        # only keep dialogues with more than min_words
        for dialogue in dialogues:
            if len(dialogue.split()) >= min_words:
                valid_dialogues.append(dialogue)

        # discard emtpy dialogues
        if len(valid_dialogues) < min_turns:
            continue

        # append the extracted dialogues to the conversations list
        conversations.append(valid_dialogues)

    return conversations


def main():
    file = read_file_as_string(os.path.join(INPATH, FILE + ".txt"))
    file = remove_footer(file)
    conversations = extract_conversations(file, 2, 2)

    print(conversations)


if __name__ == "__main__":
    main()
