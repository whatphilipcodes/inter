# IMPORT BLOCK ###############################################################
# Lib Imports
import asyncio
import threading
from typing import List, Tuple

# Local Imports
from . import __backend_config as config
from .utils import ConvoText, Mood, LoopPatch, get_timestamp

from .manager_conversation import ConvoManager
from .manager_data import DataManager
from .classifier import Classifier
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
        self._classifier = Classifier()
        self._generator = Generator()

        # Loop Flags
        self._enter_state = True
        self._new_epoch = True

        # Trust Score
        self._trust_score = 0.0

        # Start with inference
        self.state = LoopPatch.State.inference

    async def _loop(self) -> None:
        """
        Asynchronous method that defines the main loop.
        """
        if config.DEBUG_MSG:
            print("Loop started...")
        while True:
            if self.state == LoopPatch.State.training:
                # ENTER TRAINING CALLBACK ########################################
                if self._enter_state:
                    self._enter_training()
                # TRAINING FLOW ##################################################
                if self._new_epoch:
                    self._enter_epoch()
                # TRAINING FLOW ##################################################
                self._new_epoch = self._classifier.step()
                # END TRAINING FLOW ##############################################

            if self.state == LoopPatch.State.inference:
                # ENTER INFERENCE CALLBACK #######################################
                if self._enter_state:
                    self._enter_inference()
                # INFERENCE FLOW #################################################
                while not self.__inference_queue.empty():
                    input_data: ConvoText = await self.__inference_queue.get()

                    # 0) get datapoint from data manager
                    datapoint = self._data_manager.create_datapoint(input_data)

                    # 1) get classification for input_data and update trust score
                    if (input_data.text == "") or (input_data.text is None):
                        mood = Mood.doubt
                    else:
                        mood = self._classifier.infer(input_data.text)

                    if mood == Mood.truth:
                        self._trust_score = min(
                            1.0, self._trust_score + config.TRUST_MOD
                        )
                    elif mood == Mood.lie:
                        self._trust_score = max(
                            0.0, self._trust_score - config.TRUST_MOD
                        )
                    datapoint.mood = mood
                    datapoint.trust = self._trust_score

                    # 2) instruct generator to create response -> response
                    # get context for generator
                    context = self._convo_manager.get_context(mood=mood)
                    datapoint.context = context

                    # get the input string for the generator
                    input_str = self._convo_manager.get_gen_inference_str(
                        input_data, mood=mood, context=context
                    )

                    # generator: run inference on input string
                    utf = self._generator.infer(input_str)

                    # filter out response
                    response = self._convo_manager.filter_response(utf)
                    datapoint.response = response

                    # create response object
                    response_object = ConvoText(
                        convoID=input_data.convoID,
                        messageID=input_data.messageID,
                        text=response,
                        timestamp=get_timestamp(),
                        type=ConvoText.ConvoType.response,
                        trust=self._trust_score,
                    )

                    # make results available in the dictionary
                    self.__results[input_data.messageID] = response_object

                    # 3) add datapoint to data manager (data manager will evaluate mood)
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

    def get_message(self, messageID: int) -> Tuple[List[ConvoText], int]:
        """
        Returns messages from the database.
        """
        dataset_length = self._data_manager.input_database.__len__()
        message = self._data_manager.get_message(messageID)
        return message, dataset_length

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
            await asyncio.sleep(0.01)  # Check every 10 ms
        # return the result and remove it from the dictionary
        return self.__results.pop(input.messageID)

    # ENTER STATE METHODS #####################################################
    def _enter_training(self) -> None:
        """
        Run every time the loop enters the training state.
        """
        self._enter_state = False
        if config.DEBUG_MSG:
            print("Training started...")
        # save new conversations to database
        self._data_manager.save()
        # # reset trust score
        # self._trust_score = 0.0

    def _enter_inference(self) -> None:
        """
        Run every time the loop enters the inference state.
        """
        self._enter_state = False
        if config.DEBUG_MSG:
            print("Inference started...")
        # set the models to eval mode
        self._classifier.prepare_inference()

    def _enter_epoch(self) -> None:
        """
        Run every time the loop enters the epoch state.
        """
        self._new_epoch = False
        if config.DEBUG_MSG:
            print("New epoch started...")
        # reload the dataset
        cls_data = self._data_manager.get_cls_data()
        self._classifier.prepare_training(cls_data)
