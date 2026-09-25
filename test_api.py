import os
from gradio_client import Client, handle_file

token = os.environ["HF_TOKEN"]

client = Client(
    "raimisamuel/verascope-api",
    token=token
)

result = client.predict(
    image=handle_file(
        "C:/Users/HP/Documents/practice csv/Verascope/hero-image.jpg"
    ),
    api_name="/predict_image",
)

print(result)