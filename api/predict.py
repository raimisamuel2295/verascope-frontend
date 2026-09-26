import os
import tempfile

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from gradio_client import Client, handle_file

app = FastAPI()

HF_TOKEN = os.environ["HF_TOKEN"]

client = Client(
    "raimisamuel/verascope-api",
    token=HF_TOKEN
)


@app.post("/api/predict")
async def predict(request: Request):
    try:
        form = await request.form()
        image = form.get("image")

        if image is None:
            return JSONResponse(
                {"error": "No image uploaded"},
                status_code=400
            )

        contents = await image.read()

        with tempfile.NamedTemporaryFile(
            suffix=".jpg",
            delete=False
        ) as temp:
            temp.write(contents)
            temp_path = temp.name

        result = client.predict(
            image=handle_file(temp_path),
            api_name="/predict_image",
        )

        return JSONResponse(result)

    except Exception as e:
        return JSONResponse(
            {"error": str(e)},
            status_code=500
        )