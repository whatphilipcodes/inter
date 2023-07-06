# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import uvicorn
from fastapi import FastAPI

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

### Create FastAPI app
app = FastAPI()

### Routes
@app.get("/")
async def root():
    return {"message": "Hello World"}

### Start FastAPI as Server
uvicorn.run(app, host='127.0.0.1', port=port)