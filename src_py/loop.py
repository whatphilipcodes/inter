# IMPORT BLOCK ###############################################################
# Lib Imports
import asyncio
import datetime
import threading

# src
from . import config
from .utils import ConvoText
# END IMPORT BLOCK ###########################################################

class MainLoop:
    '''
    Runs the training steps and allows to interrupt for inference.\n
    All models and data are managed here. FastAPI only calls the\n
    methods of this class.
    '''
    def __init__(self) -> None:
        self.__inference_queue = asyncio.Queue()
        self.__results: dict[int, ConvoText] = {}
        self._thread = threading.Thread(target=self._run_loop_in_thread)
        self._thread.daemon = True  # to end the loop if the main thread ends
        self._paused = False

    async def _loop(self) -> None:
        if config.DEBUG_MSG: print("Loop started...")
        while True:
            # only run MainLoop if not paused
            if not self._paused:
                # Actual MainLoop ################################################
                await asyncio.sleep(1) # Simulate some work
                # END Actual MainLoop ############################################

            # handle Pause/Resume
            if not self.__inference_queue.empty():
                if config.DEBUG_MSG and not self._paused: print("Loop paused. Inference started...")
                self._paused = True  # flag loop as paused
                while not self.__inference_queue.empty():  # work through the queue
                    input_data: ConvoText = await self.__inference_queue.get()

                    # Placeholder for actual inference code
                    result = f"Inferred data from: {input_data.text}"

                    # TODO: Move the creation of the response ConvoText to the datamanager
                    response = ConvoText(
                        convoID=input_data.convoID,
                        messageID=input_data.messageID + 1,
                        text=result,
                        timestamp=datetime.datetime.now().strftime("%Y-%m-%d_%H:%M:%S:%f"),
                        type=ConvoText.ConvoType.RESPONSE
                        )

                    # make results available in the dictionary
                    self.__results[input_data.messageID] = response
                    self.__inference_queue.task_done()

                # await cooldown
                self._paused = False
                intervall = int(config.TRAIN_COUNTDOWN / .01)
                for i in range(intervall):
                    if not (self.__inference_queue.empty()):
                        self._paused = True
                        break
                    await asyncio.sleep(.01)  # Check every 10 ms

                if config.DEBUG_MSG and not self._paused: print("Inference ended. Loop resumed...")

    def _run_loop_in_thread(self) -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._loop())
        loop.close()

    def start(self) -> None:
        self._thread.start()

    async def infer(self, input: ConvoText) -> ConvoText:
        # put the input into the queue
        await self.__inference_queue.put(input)
        # wait for the result to become available and return it
        while input.messageID not in self.__results:
            await asyncio.sleep(0.1)  # Check every 100 m
        # return the result and remove it from the dictionary
        return self.__results.pop(input.messageID)
