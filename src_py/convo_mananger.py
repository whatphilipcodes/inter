# IMPORT BLOCK ###############################################################
# Lib Imports
import datetime
import random

# Local Imports
from . import __backend_config as config
from .utils import ConvoText, Mood

# END IMPORT BLOCK ###########################################################


class ConvoManager:
    """
    Manages the conversation history and the context, input and response.
    All methods operate on strings as tokenization is handled by the models directly.
    """

    def __init__(self) -> None:
        # special tokens -> special_tokens_map.json, tokenizer.json
        self.con_tok = "<|context|>"
        self.inp_tok = "<|input|>"
        self.res_tok = "<|response|>"
        self.eos_tok = "<|endoftext|>"

        # props
        self.convoID = 0
        self.history = []
        self.current_input = ""

    # Public Methods ###########################################################
    def get_inference_string(self, input: ConvoText, mood=Mood.neutral) -> str:
        """
        Returns the conversation history as a single string.
        """
        # Check if the conversation has changed
        if input.convoID != self.convoID:
            self.convoID = input.convoID
            self.history = []

        # Check if the input is empty
        if input.text == "":
            input.text = self._get_convo_starter(mood)

        # Build the input string
        self.current_input = (
            self.con_tok
            + self._get_context(mood)
            + self._get_history()
            + self.inp_tok
            + input.text
            + self.res_tok
        )

        # Update the history with the input
        self._update_history(input.text)

        # if config.DEBUG_MSG:
        #     print(f"Input string:\n {self.current_input}")

        return self.current_input

    def filter_response(self, response: str) -> str:
        """
        Filters out the special tokens from the response.
        Only works if get_inference_string() was called before on this instance.
        """
        filtered = response.replace(self.current_input, "").replace(self.eos_tok, "")
        processed = self._postprocess(filtered)
        # if config.DEBUG_MSG:
        #     print(f"Filtered result:\n {processed}")
        self._update_history(processed)
        return processed

    def get_training_string(self, mood: str, input: str, response: str) -> str:
        return (
            self.con_tok
            + mood
            + self.inp_tok
            + input
            + self.res_tok
            + response
            + self.eos_tok
        )

    # END Public Methods #######################################################

    # PRIVATE METHODS ##########################################################
    def _get_convo_starter(self, mood: Mood) -> str:
        return "Not yet implemented."

    def _get_context(self, mood: Mood) -> str:
        """
        Returns a context string based on the mood.
        """
        FORLANG = [
            "You don't understand what your friend is saying.",
            "You are having troubles to understand your friend. Ask for clarification.",
            "You are confused. What your friend is saying doesn't make sense.",
        ]
        NEUTRAL = [
            "You are having a converation with a friend.",
            "You are talking to a friend.",
            "You and a friend are having a conversation.",
        ]
        TRUTH = [
            "You agree with what your friend just said.",
            "You are happy that your friend said that. Aknlowedge their idea.",
            "You are positively overwhelmed. Tell them that you agree.",
        ]
        DOUBT = [
            "You are not sure if you agree with what your friend just said.",
            "You doubt the idea your friend just proposed.",
            "You are not sure if you agree with your friend.",
        ]
        LIE = [
            "You are very unhappy with what your friend just said. Tell them that you disagree strongly.",
            "Your friend just lied to you. Tell them you are disappointed in them.",
            "You are very disappointed in your friend. Tell them that you disagree strongly.",
        ]

        if mood == Mood.forlang:
            return random.choice(FORLANG)
        elif mood == Mood.neutral:
            return random.choice(NEUTRAL)
        elif mood == Mood.truth:
            return random.choice(TRUTH)
        elif mood == Mood.doubt:
            return random.choice(DOUBT)
        elif mood == Mood.lie:
            return random.choice(LIE)

    def _update_history(self, append: str) -> None:
        """
        Updates the conversation history with the new input.
        """
        self.history.append(append)

    def _get_history(self) -> str:
        """
        Returns the conversation history as a single string with input and response tokens alternating.
        """

        # Initialize an empty string to store the concatenated history
        concatenated_history = ""

        # Iterate through the history array
        for i, entry in enumerate(self.history):
            # Determine which token to use based on whether the index is even or odd
            token = self.inp_tok if i % 2 == 0 else self.res_tok

            # Append the token and entry to the concatenated_history
            concatenated_history += token + entry

        return concatenated_history

    def _postprocess(self, text: str) -> str:
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

        # END PRIVATE METHODS ######################################################
