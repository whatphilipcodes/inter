import os
import regex

INPATH = "./resources_dev/data/raw/source"
OUTPATH = "./resources_dev/data/raw/processed"


def open_txt_file(file_path):
    """Opens a text file and returns a list of lines."""
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return lines


def remove_footer(lines):
    # Look for the specified strings
    for index, line in enumerate(lines):
        if (
            "END OF THE PROJECT GUTENBERG EBOOK" in line
            or "End of the Project Gutenberg EBook" in line
        ):
            # Find the last non-empty line preceding the target text
            for preceding_index in range(index - 1, -1, -1):
                if lines[preceding_index].strip():
                    break

                # Remove everything from the last non-empty line onward
                lines = lines[: preceding_index + 1]
                break

    return lines


def extract_dialog(lines, min_words=1, min_rounds=2):
    dialogue_pattern = regex.compile(r"(?<=^|\s)(?:\"|\“)(.*?)(?:\"|\”)", regex.DOTALL)
    contexts_dialogues = []

    # Concatenating lines into a single string
    text = "".join(lines)

    # Splitting text into contexts (paragraphs)
    contexts = regex.split(r"(?:\n){3,}", text)

    for context in contexts:
        # Removing unwanted tags and extra spaces
        context = context.replace("<i>", "").replace("</i>", "").replace("\n", " ")
        context = regex.sub(r"\s{2,}", " ", context)

        # Finding all dialogues within the context
        dialogues = dialogue_pattern.findall(context)

        # if the following dialogue starts lower case, join it to the previous one
        for index, dialogue in enumerate(dialogues):
            if index > 0 and dialogue[0].islower():
                dialogues[index - 1] += " " + dialogue
                dialogues[index] = ""

        extracted_dialogues = []
        for dialogue in dialogues:
            if len(dialogue.split()) >= min_words:
                extracted_dialogues.append(dialogue)

        # Appending extracted dialogues for the current context
        contexts_dialogues.append(extracted_dialogues)

        # removing empty contexts
        for context in contexts_dialogues:
            if len(context) < min_rounds:
                contexts_dialogues.remove(context)

    return contexts_dialogues


def main():
    lines = open_txt_file(
        os.path.join(INPATH, "The War of the Worlds by H. G. Wells.txt")
    )

    lines = remove_footer(lines)
    dialogues = extract_dialog(lines, 1)

    print(dialogues)


if __name__ == "__main__":
    main()
