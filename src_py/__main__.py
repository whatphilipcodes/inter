# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import asyncio

# src
from .api import API
from . import async_chat as chat
from . import async_trainf as trainf

# END IMPORT BLOCK ###########################################################

def setup_env():
    '''
    Sets up environment variables to prevent unnecessary warnings\n
    which are not supported by the hardware.
    '''
    # Prevent triton warning
    os.environ['XFORMERS_FORCE_DISABLE_TRITON'] = '1'

def main():
    
    setup_env()
    api = API()
    api.start_server()

    '''
    ### Async Testing
    inference_queue = asyncio.Queue()

    # Lists to hold all tasks
    critical_tasks = []
    side_tasks = []

    # Create tasks
    critical_tasks.append(asyncio.create_task(trainf.run(inference_queue)))
    side_tasks.append(asyncio.create_task(chat.run(inference_queue)))
    
    # Await all critical (running until program is ended) tasks
    await asyncio.gather(*critical_tasks)

    # Cancel all side tasks
    for task in side_tasks:
        task.cancel()

    '''

    print('# sucessfully ran main')
    

# Since this project relies heavily on relative imports,
# no idiomatic statement like `if __name__ == '__main__'` can be used.
