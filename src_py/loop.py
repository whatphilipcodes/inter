# IMPORT BLOCK ###############################################################
# Lib Imports
import asyncio
import datetime
import threading

# src
from . import __backend_config as config
from .utils import ConvoText, LoopPatch

from .generator import Generator

# END IMPORT BLOCK ###########################################################


class MainLoop:
    """
    Runs the training steps and allows to interrupt for inference.
    All models and data are managed here. FastAPI only calls the
    methods of this class.
    """

    def __init__(self) -> None:
        # Loop Props
        self.__inference_queue = asyncio.Queue()
        self.__results: dict[int, ConvoText] = {}
        self._thread = threading.Thread(target=self._run_loop_in_thread)
        self._thread.daemon = True  # to end the loop if the main thread ends
        self._show_status = True
        self.state = LoopPatch.State.loading

        # Model Props
        self._generator = Generator()

    async def _loop(self) -> None:
        """
        Asynchronous method that defines the main loop.
        """
        if config.DEBUG_MSG:
            print("Loop started...")
        while True:
            if self.state == LoopPatch.State.training:
                # TRAINING FLOW ##################################################
                if config.DEBUG_MSG:
                    print("Training...")
                await asyncio.sleep(2)  # Simulate some work
                # END TRAINING FLOW ##############################################

            if self.state == LoopPatch.State.inference:
                # INFERENCE FLOW #################################################
                while not self.__inference_queue.empty():
                    input_data: ConvoText = await self.__inference_queue.get()

                    # Placeholder for actual inference code
                    result = self._generator.infer(input_data.text)
                    response = ConvoText(
                        convoID=input_data.convoID,
                        messageID=input_data.messageID,
                        text=result,
                        timestamp=datetime.datetime.now().strftime(
                            "%Y-%m-%d_%H:%M:%S:%f"
                        ),
                        type=ConvoText.ConvoType.response,
                    )

                    # make results available in the dictionary
                    self.__results[input_data.messageID] = response
                    self.__inference_queue.task_done()
                # END INFERENCE FLOW #############################################

            if self.state == LoopPatch.State.exit:
                # EXIT FLOW ######################################################
                if config.DEBUG_MSG:
                    print("Loop ended...")
                break
                # END EXIT FLOW ##################################################

    def _run_loop_in_thread(self) -> None:
        """
        Runs the main loop in a separate thread using asyncio's event loop.
        It sets a new event loop, runs the main loop in this event loop,
        and finally closes the event loop when the main loop completes.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._loop())
        loop.close()

    def start(self) -> None:
        """
        Starts the thread in which the main loop runs.
        The main loop runs in the background, separate from the main thread.
        """
        self._thread.start()

    async def update(self, patch: LoopPatch) -> LoopPatch:
        """
        Updates the state of the main loop.
        """
        self.state = patch.state
        return LoopPatch(state=self.state)

    async def infer(self, input: ConvoText) -> ConvoText:
        """
        Adds an input to the inference queue and waits for the result to become available.
        - It puts the input into the inference queue.
        - It waits for the result to become available.
        - Once the result is available, it removes the result from the dictionary and returns it.
        """
        # put the input into the queue
        await self.__inference_queue.put(input)
        # wait for the result to become available and return it
        while input.messageID not in self.__results:
            await asyncio.sleep(0.1)  # Check every 100 ms
        # return the result and remove it from the dictionary
        return self.__results.pop(input.messageID)
