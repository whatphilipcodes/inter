# IMPORT BLOCK ###############################################################
# Lib Imports
import re
import random
from typing import List

# Local Imports
from .utils import ConvoText, Mood, SpecialTokens

# END IMPORT BLOCK ###########################################################


class ConvoManager:
    """
    Manages the conversation history and the context, input and response.
    All methods operate on strings as tokenization is handled by the models directly.
    """

    def __init__(self) -> None:
        # props
        self.convoID = 0
        self.history = []
        self.current_input = ""

    # Public Methods ###########################################################
    def get_context(self, mood: Mood) -> str:
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
        elif mood == Mood.truth:
            return random.choice(TRUTH)
        elif mood == Mood.doubt:
            return random.choice(DOUBT)
        elif mood == Mood.lie:
            return random.choice(LIE)

    def get_gen_inference_str(
        self, input: ConvoText, mood=Mood.doubt, context=None
    ) -> str:
        """
        Returns the conversation with history as a single string.
        """
        # Get context if None
        if context is None:
            context = self.get_context(mood)

        # Check if the conversation has changed
        if input.convoID != self.convoID:
            self.convoID = input.convoID
            self.history = []

        # Check if the input is empty
        if input.text == "":
            input.text = self._get_greeting()

        # Build the input string
        self.current_input = (
            SpecialTokens.context
            + context
            + self._get_history()
            + SpecialTokens.input
            + input.text
            + SpecialTokens.response
        )

        # Update the history with the input
        self._update_history(input.text)

        return self.current_input

    def filter_response(self, response: str) -> str:
        """
        Filters out the special tokens from the response.
        Only works if get_inference_string() was called before on this instance.
        """
        filtered = response.replace(self.current_input, "").replace(
            SpecialTokens.endseq, ""
        )
        processed = self._postprocess(filtered)

        # regex filter
        nonw_start = r"^\W.*?\n|^\n"
        processed = re.sub(nonw_start, "", processed)

        # send retry signal if response is empty
        if not re.search(r"[a-zA-Z]", processed):
            processed = "<|retry|>"

        self._update_history(processed)
        return processed

    # END Public Methods #######################################################

    # PRIVATE METHODS ##########################################################

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
            token = SpecialTokens.input if i % 2 == 0 else SpecialTokens.response

            # Append the token and entry to the concatenated_history
            concatenated_history += token + entry

        return concatenated_history

    def _postprocess(self, text: str) -> str:
        """
        Post-process the generated text to ensure it ends with a complete sentence.

        This method checks if the text ends with a sentence-ending punctuation mark (".", "!", "?").
        If it doesn't, the method finds the last occurrence of a sentence-ending punctuation mark
        and truncates the text at that position.
        """
        if not text.endswith((".", "!", "?")):
            # Find the last occurrence of a sentence-ending punctuation mark
            end_position = max(text.rfind("."), text.rfind("!"), text.rfind("?"))
            if end_position != -1:
                text = text[: end_position + 1]

        return text.strip()

    def _get_greeting(self) -> str:
        """
        Returns a random greeting.
        """
        greetings = [
            "Hello, my friend!",
            "Hi there!",
            "Hey.",
            "Hiya! I've been thinking about you.",
            "Hello! How are you doing?",
            "Greetings, wonderful soul!",
            "Hey, stranger!",
            "Howdy, partner!",
            "Hey, you!",
            "Hey, sunshine!",
        ]
        return random.choice(greetings)

        # END PRIVATE METHODS ######################################################
