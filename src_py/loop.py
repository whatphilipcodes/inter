# IMPORT BLOCK ###############################################################
# Lib Imports
import asyncio
import datetime
import threading

# src
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
        self._thread.daemon = True  # to make sure to end the loop if the main thread ends

    async def _loop(self) -> None:
        while True:
            # Actual Loop Code
            await asyncio.sleep(1)

            # Handle Pause/Resume
            if not self.__inference_queue.empty():
                print("Loop paused!")
                input_data: ConvoText = await self.__inference_queue.get()

                # # Exit condition
                # if input_data == "bye":
                #     print("Loop ended...")
                #     break

                # Placeholder for actual inference code
                result = f"Inferred data from: {input_data.text}"

                # TODO: Move the creation of the response ConvoText to the datamanger
                response = ConvoText(
                    convoID=input_data.convoID,
                    messageID=input_data.messageID + 1,
                    text=result,
                    timestamp=datetime.datetime.now().strftime("%Y-%m-%d_%H:%M:%S:%f"),
                    type=ConvoText.ConvoType.RESPONSE
                    )

                # Save the result to the results dictionary
                self.__results[input_data.messageID] = response

                self.__inference_queue.task_done()
                print("Loop resumed!")

    def _run_loop_in_thread(self) -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._loop())
        loop.close()

    def start(self) -> None:
        self._thread.start()

    async def infer(self, input: ConvoText) -> ConvoText:
        # Put the input into the queue
        await self.__inference_queue.put(input)

        # Wait for the result to become available and return it
        while input.messageID not in self.__results:
            await asyncio.sleep(0.1)  # Check every 100 ms

        return self.__results.pop(input.messageID)
