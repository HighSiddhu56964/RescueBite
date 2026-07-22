export async function sarvamSpeechToText(audioBlob) {
  console.log("STT called with blob:", audioBlob.type, audioBlob.size, "bytes");

  // Sarvam STT accepts webm, wav, mp3, ogg, opus, flac, mp4
  // MediaRecorder in browser produces audio/webm by default - that's fine
  // Just make sure we give it the right filename extension
  const mimeType = audioBlob.type || "audio/webm";
  const extension = mimeType.includes("wav") ? "wav"
    : mimeType.includes("mp3") ? "mp3"
    : mimeType.includes("ogg") || mimeType.includes("opus") ? "ogg"
    : "webm"; // default - browsers use webm

  const formData = new FormData();
  formData.append("file", audioBlob, `recording.${extension}`);
  formData.append("model", "saaras:v3");
  formData.append("mode", "transcribe");
  // Do NOT set language_code - let Sarvam auto-detect it

  let response;
  try {
    response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": import.meta.env.VITE_SARVAM_API_KEY
        // Do NOT set Content-Type here - browser sets it automatically with boundary for FormData
      },
      body: formData
    });
  } catch (networkErr) {
    console.error("Network error calling Sarvam STT:", networkErr);
    throw new Error("Network error calling STT");
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Sarvam STT error:", response.status, errorText);
    throw new Error(`Sarvam STT failed: ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log("Sarvam STT response:", data);

  if (!data.transcript) {
    console.warn("Empty transcript in STT response:", data);
    return "";
  }

  return data.transcript;
}
