# IMPORT BLOCK ###############################################################

# Lib Imports
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# END IMPORT BLOCK ###########################################################

class API:

    def __init__(self) -> None:
        ### Get port number from electron app
        self.uvi_port = os.environ.get('UVI_PORT')
        if self.uvi_port is not None:
            try:
                self.uvi_port = int(self.uvi_port)
                # Use the uvi_port variable as an integer
                print("uvi_port number:", self.uvi_port)
            except ValueError:
                print("Invalid uvi_port number:", self.uvi_port)
        else:
            print("UVI_PORT environment variable is not set.")

        ### Get host from electron app
        self.uvi_host = os.environ.get('UVI_HOST')
        if self.uvi_host is not None:
            try:
                self.uvi_host = str(self.uvi_host)
                # Use the uvi_host variable as an integer
                print("uvi_host:", self.uvi_host)
            except ValueError:
                print("Invalid uvi_host:", self.uvi_host)
        else:
            print("UVI_HOST environment variable is not set.")

        ### Get host from electron app
        self.el_url = os.environ.get('EL_URL')
        if self.el_url is not None:
            try:
                self.el_url = str(self.el_url)
                # Use the el_url variable as an integer
                print("el_url:", self.el_url)
            except ValueError:
                print("Invalid el_url:", self.el_url)
        else:
            print("EL_URL environment variable is not set.")

        ### Check if env variables are set
        if self.uvi_port is None or self.uvi_host is None or self.el_url is None:
            raise Exception("Environment variables could not be found.")

        ### Create FastAPI app
        self.app = FastAPI()

        ### Middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=[self.el_url],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        ### Routes
        @self.app.get("/")
        async def root():
            return {
                "message": "Hello World"}

    def start_server(self):
        ### Start FastAPI as Server
        uvicorn.run(self.app, host=self.uvi_host, port=self.uvi_port)