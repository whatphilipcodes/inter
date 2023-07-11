# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# END IMPORT BLOCK ###########################################################

### Get port number from electron app
uvi_port = os.environ.get('UVI_PORT')
if uvi_port is not None:
    try:
        uvi_port = int(uvi_port)
        # Use the uvi_port variable as an integer
        print("uvi_port number:", uvi_port)
    except ValueError:
        print("Invalid uvi_port number:", uvi_port)
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

### Create FastAPI app
app = FastAPI()

### Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[el_url],
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
uvicorn.run(app, host=uvi_host, port=uvi_port)