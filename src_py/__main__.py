# IMPORT BLOCK ###############################################################

# Lib Imports
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# src
from .utils import setup_env, get_uvi_info, get_host_info

# END IMPORT BLOCK ###########################################################

def main():

    ### initialization
    setup_env()
    uvi_port, uvi_host = get_uvi_info()
    el_url = get_host_info()

    ### Create FastAPI app
    app = FastAPI()

    ### Add Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[el_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    ### API Routes
    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    ### Start FastAPI as Server
    uvicorn.run(app, host=uvi_host, port=uvi_port)
    

# Since this project relies heavily on relative imports,
# no idiomatic statement like `if __name__ == '__main__'` can be used.
