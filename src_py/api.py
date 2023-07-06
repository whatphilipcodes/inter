# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import asyncio

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

### Get host from electron app
host = os.environ.get('HOST')
if host is not None:
    try:
        host = str(host)
        # Use the host variable as an integer
        print("Host:", host)
    except ValueError:
        print("Invalid host:", host)
else:
    print("HOST environment variable is not set.")


async def loop_test():
    ### Test Loop
    while True:
        print("PyLoop running...")
        await asyncio.sleep(1)