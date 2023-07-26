import asyncio

def get_input():
    return input("Enter your message (or 'bye' to exit): ")

async def run(inference_queue: asyncio.Queue):
    while True:
        loop = asyncio.get_running_loop()
        input_future = loop.run_in_executor(None, get_input)
        user_input = await input_future
        await inference_queue.put(user_input) # Put the input into the queue
        await inference_queue.join() # Wait until the queue is empty