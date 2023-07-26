import asyncio
import threading

class MainLoop:
    '''
    Runs the training steps and allows to interrupt for inference.\n
    All models and data are managed here. FastAPI only calls the\n
    methods of this class.
    '''
    def __init__(self) -> None:
        self._thread = threading.Thread(target=self._run_loop_in_thread)
        self._thread.daemon = True  # make thread a daemon thread

    async def _loop(self) -> None:
        while True:
            print("Running independent loop...")
            await asyncio.sleep(1)

    def _run_loop_in_thread(self) -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._loop())
        loop.close()

    def start(self) -> None:
        self._thread.start()
