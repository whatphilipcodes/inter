# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

### Get host from electron app
url = os.environ.get('URL')
if url is not None:
    try:
        url = str(url)
        # Use the url variable as an integer
        print("url:", url)
    except ValueError:
        print("Invalid URL:", url)
else:
    print("URL environment variable is not set.")

### Create FastAPI app
app = FastAPI()

### Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### Routes
@app.get("/")
async def root():
    return {
        "message": "Hello World"}

### Start FastAPI as Server
uvicorn.run(app, host=host, port=port)