# IMPORT BLOCK ###############################################################
# Lib Imports
import asyncio
import threading

# Local Imports
from . import __backend_config as config
from .utils import ConvoText, LoopPatch, get_timestamp, Mood

from .manager_conversation import ConvoManager
from .manager_data import DataManager
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
        self.state = LoopPatch.State.loading

        # Model Props
        self._convo_manager = ConvoManager()
        self._data_manager = DataManager()
        self._generator = Generator()
        self._classifier = None

        # Loop Flags
        self._enter_state = True

    async def _loop(self) -> None:
        """
        Asynchronous method that defines the main loop.
        """
        if config.DEBUG_MSG:
            print("Loop started...")
        while True:
            if self.state == LoopPatch.State.training:
                # ENTER TRAINING FLOW ############################################
                if self._enter_state:
                    self._enter_training()
                # TRAINING FLOW ##################################################
                if config.DEBUG_MSG:
                    print("Training...")
                await asyncio.sleep(2)  # Simulate some work
                # END TRAINING FLOW ##############################################

            if self.state == LoopPatch.State.inference:
                # ENTER INFERENCE FLOW ###########################################
                if self._enter_state:
                    self._enter_inference()
                # INFERENCE FLOW #################################################
                while not self.__inference_queue.empty():
                    input_data: ConvoText = await self.__inference_queue.get()

                    # 0) get datapoint from data manager
                    datapoint = self._data_manager.get_datapoint(input_data)

                    # 1) get classification for input_data -> mood
                    # mood = self._classifier.infer(input_data.text)
                    # datapoint.mood = mood

                    # 2) instruct generator to create response -> response
                    # get context for generator
                    context = self._convo_manager.get_context(Mood.neutral)
                    datapoint.context = context

                    # get the input string for the generator
                    input_str = self._convo_manager.get_gen_inference_str(
                        input_data, Mood.neutral, context
                    )

                    # generator: run inference on input string
                    raw = self._generator.infer(input_str)

                    # filter out response
                    response = self._convo_manager.filter_response(raw)
                    datapoint.response = response

                    # create response object
                    response_object = ConvoText(
                        convoID=input_data.convoID,
                        messageID=input_data.messageID,
                        text=response,
                        timestamp=get_timestamp(),
                        type=ConvoText.ConvoType.response,
                    )

                    # make results available in the dictionary
                    self.__results[input_data.messageID] = response_object

                    # 3) add new datapoint to training database & save
                    self._data_manager.add(datapoint)

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
        self._enter_state = True
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

    # ENTER STATE METHODS #####################################################
    def _enter_training(self) -> None:
        """
        Run every time the loop enters the training state.
        """
        self._enter_state = False
        if config.DEBUG_MSG:
            print("Running training...")
        # save new conversations to database
        self._data_manager.save()

    def _enter_inference(self) -> None:
        """
        Run every time the loop enters the inference state.
        """
        self._enter_state = False
        if config.DEBUG_MSG:
            print("Running inference...")
