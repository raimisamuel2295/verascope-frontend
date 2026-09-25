export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!image) {
      return res.status(400).json({
        error: "No image provided"
      });
    }

    const hfToken = process.env.HF_TOKEN;

    if (!hfToken) {
      return res.status(500).json({
        error: "HF_TOKEN is not configured"
      });
    }

    const baseUrl =
      "https://raimisamuel-verascope-api.hf.space";

    // 1. Upload the image to Hugging Face
    const uploadData = new FormData();
    uploadData.append("files", image);

    const uploadResponse = await fetch(
      `${baseUrl}/gradio_api/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`
        },
        body: uploadData
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();

      return res.status(uploadResponse.status).json({
        error: "Hugging Face image upload failed",
        details: errorText
      });
    }

    const uploadedFiles = await uploadResponse.json();
    const filePath = uploadedFiles[0];

    // 2. Send the uploaded image to predict_image
    const predictResponse = await fetch(
      `${baseUrl}/gradio_api/call/predict_image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: [
            {
              path: filePath,
              meta: {
                _type: "gradio.FileData"
              }
            }
          ]
        })
      }
    );

    if (!predictResponse.ok) {
      const errorText = await predictResponse.text();

      return res.status(predictResponse.status).json({
        error: "Hugging Face prediction request failed",
        details: errorText
      });
    }

    const predictionJob = await predictResponse.json();

    const eventId = predictionJob.event_id;

    // 3. Wait for the prediction result
    const resultResponse = await fetch(
      `${baseUrl}/gradio_api/call/predict_image/${eventId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${hfToken}`
        }
      }
    );

    const resultText = await resultResponse.text();

    return res
      .status(resultResponse.ok ? 200 : resultResponse.status)
      .send(resultText);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Prediction request failed",
      details: error.message
    });
  }
}