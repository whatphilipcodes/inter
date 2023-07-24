# IMPORT BLOCK ###############################################################

# Lib Imports
import os, sys
import torch

# END IMPORT BLOCK ###########################################################

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