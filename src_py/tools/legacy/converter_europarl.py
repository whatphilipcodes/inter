import os
import random
import pandas as pd
from sklearn.model_selection import train_test_split

# Root folder containing subfolders
root_folder = "./resources_dev/data/europarl"

# Output folder
output_folder = "./resources_dev/data/europarl_select_50k"

# Create output folder if it does not exist
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Output parquet file paths
train_output = os.path.join(output_folder, "train.parquet")
test_output = os.path.join(output_folder, "test.parquet")
val_output = os.path.join(output_folder, "validation.parquet")

# Set amount of data to use
examples_amount = 50000
val_ratio = 0.1
test_ratio = 0.1

# Create empty DataFrames for train, eval, and test splits
df_train = pd.DataFrame(columns=["language", "text"])
df_test = pd.DataFrame(columns=["language", "text"])
df_val = pd.DataFrame(columns=["language", "text"])

# Iterate through subfolders
for subfolder in os.listdir(root_folder):
    subfolder_path = os.path.join(root_folder, subfolder)

    # Check if the item is a directory
    if os.path.isdir(subfolder_path):
        # Get the file paths within the subfolder
        file_paths = [
            os.path.join(subfolder_path, file) for file in os.listdir(subfolder_path)
        ]

        # Check if there are two files in the subfolder
        if len(file_paths) == 2:
            # Find the file that does not end with ".en"
            non_en_file = next(file for file in file_paths if not file.endswith(".en"))

            # Read the content of the non-English file
            with open(non_en_file, "r", encoding="utf8") as file:
                content = file.read()

            # Check the percentage of non-Latin alphabet characters
            non_latin_count = sum(
                1 for char in content if not char.isalpha() or not char.isascii()
            )
            percentage_non_latin = (non_latin_count / len(content)) * 100

            # Discard the file if the percentage exceeds 60%
            if percentage_non_latin > 60:
                print(f"{non_en_file} has been discarded.")
            else:
                # Extract random sentences that meet the criteria
                sentences = [sentence.strip() for sentence in content.split("\n")]
                selected_sentences = [
                    sentence
                    for sentence in sentences
                    if len(sentence.split()) > 5 and "(" not in sentence
                ]

                # Remove duplicates
                selected_sentences = list(set(selected_sentences))

                # Randomly select sentences
                if examples_amount > len(selected_sentences):
                    print(
                        f"Warning: {non_en_file} has less than {examples_amount} sentences."
                    )
                selected_sentences = random.sample(
                    selected_sentences, k=min(examples_amount, len(selected_sentences))
                )

                # Create a DataFrame for the selected sentences
                df_current = pd.DataFrame(
                    {
                        "language": [os.path.splitext(non_en_file)[1][1:]]
                        * len(selected_sentences),
                        "text": selected_sentences,
                    }
                )

                # Shuffle the DataFrame
                df_current = df_current.sample(frac=1, random_state=42).reset_index(
                    drop=True
                )

                # Split the DataFrame into train, validation, and test sets
                df_current_train, df_current_valntest = train_test_split(
                    df_current, test_size=val_ratio + test_ratio, random_state=42
                )
                df_current_val, df_current_test = train_test_split(
                    df_current_valntest,
                    test_size=test_ratio / (val_ratio + test_ratio),
                    random_state=42,
                )

                # Append the splits to the corresponding DataFrames
                df_train = pd.concat([df_train, df_current_train], ignore_index=True)
                df_test = pd.concat([df_test, df_current_test], ignore_index=True)
                df_val = pd.concat([df_val, df_current_val], ignore_index=True)

# Write the train, val, and test DataFrames to the parquet files
df_train.to_parquet(train_output, index=False)
df_val.to_parquet(val_output, index=False)
df_test.to_parquet(test_output, index=False)
