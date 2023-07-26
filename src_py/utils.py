# IMPORT BLOCK ###############################################################
# Lib Imports
import os, sys
import torch
from pydantic import BaseModel
from typing import Optional
from enum import Enum
# END IMPORT BLOCK ###########################################################

# FUNCTION BLOCK #############################################################
def setup_env() -> None:
    '''
    Sets up environment variables to prevent unnecessary warnings\n
    which are not supported by the hardware.
    '''
    # Prevent triton warning
    os.environ['XFORMERS_FORCE_DISABLE_TRITON'] = '1'

def get_resource_path() -> str:
    '''
    Returns the path to the resources directory depending on wether the program is frozen or not\n
    ('resources' when frozen, 'resources_dev' when not)
    '''
    if getattr(sys, 'frozen', False):
        # MEIPASS is a variable configured by PyInstaller
        return os.path.join(sys._MEIPASS, 'resources') # type: ignore
    else:
        return os.path.join(os.getcwd(), 'resources_dev')
    
def get_cuda() -> torch.device:
    '''
    Returns the device to use for training\n
    (GPU if available, CPU otherwise)
    '''
    if (torch.cuda.is_available()):
        print('CUDA available, using GPU')
        return torch.device('cuda')
    else:
        print('CUDA not available, using CPU')
        return torch.device('cpu')
    
def get_uvi_info() -> tuple[int | None, str | None]:
    '''
    Returns the port number and host which the electron app defined\n
    in the environment variables as (UVI_PORT) and the host (UVI_HOST).\n
    port, host = get_uvi_info()
    '''
    ### Get port number from electron app
    uvi_port_str = os.environ.get('UVI_PORT')
    uvi_port = None
    if uvi_port_str is not None:
        try:
            uvi_port = int(uvi_port_str)
            # Use the uvi_port variable as an integer
            print("uvi_port number:", uvi_port)
        except ValueError:
            print("Invalid uvi_port number:", uvi_port_str)
    else:
        print("UVI_PORT environment variable is not set.")

    ### Get host from electron app
    uvi_host = os.environ.get('UVI_HOST')
    if uvi_host is not None:
        try:
            uvi_host = str(uvi_host)
            # Use the uvi_host variable as an integer
            print("uvi_host:", uvi_host)
        except ValueError:
            print("Invalid uvi_host:", uvi_host)
    else:
        print("UVI_HOST environment variable is not set.")
    
    return uvi_port, uvi_host

def get_host_info() -> str | None:
    '''
    Returns the host adress of the electron app\n
    to whitelist it in the CORS middleware.
    '''
    ### Get host from electron app
    el_url = os.environ.get('EL_URL')
    if el_url is not None:
        try:
            el_url = str(el_url)
            # Use the el_url variable as an integer
            print("el_url:", el_url)
        except ValueError:
            print("Invalid el_url:", el_url)
    else:
        print("EL_URL environment variable is not set.")
    
    return el_url
# END FUNCTION BLOCK #########################################################

# CLASSES BLOCK ##############################################################
class ConvoText(BaseModel):
    '''
    Datamodel shared between the FastAPI server and the Electron app.\n
    This reflects the structure in which inputs and responses are exchanged.
    '''
    class ConvoType(Enum):
        '''
        Enum for the different types of conversation data.
        '''
        INPUT = 0
        RESPONSE = 1
    
    #  Props
    convoID: int
    messageID: int
    timestamp: str
    type: ConvoType
    text: str
    tokens: Optional[list[str]] = None
# END CLASSES BLOCK ##########################################################