# IMPORT BLOCK ###############################################################

# Lib Imports
import os

# END IMPORT BLOCK ###########################################################

### Get port number from electron app
port = os.environ.get('PORT')
if port is not None:
    try:
        port = int(port)
        # Use the port variable as an integer
        print("Port number:", port)
    except ValueError:
        print("Invalid port number:", port)
else:
    print("PORT environment variable is not set.")