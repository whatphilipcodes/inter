import asyncio
from .classifier import Classifier

async def run(inference_queue: asyncio.Queue):

    cls = Classifier('to-delete', 'europarl_select')
    print("Training started...")

    # Training Loop
    while True:
        cls.training_step() # -> more steps per iteration
        await asyncio.sleep(0.0001) # Breaks without, however slows down trianing #inquiry
        if not inference_queue.empty():
            print("Training paused!")
            input_data = await inference_queue.get()
            
            # Exit condition
            if input_data == "bye":
                score = await cls.evaluate()
                print(f"Final score: {score}")
                cls.save()
                print("Demo ended...")
                break

            result = await cls.infer(input_data)
            print(result)

            inference_queue.task_done()
            print("Training resumed!")