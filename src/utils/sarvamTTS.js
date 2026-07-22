export async function sarvamTextToSpeech(text) {
  // Truncate to 2500 chars max (bulbul:v3 limit)
  const safeText = text.slice(0, 400);

  let response;
  try {
    response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": import.meta.env.VITE_SARVAM_API_KEY
      },
      body: JSON.stringify({
        inputs: [safeText],
        target_language_code: "en-IN",
        speaker: "shubh",
        model: "bulbul:v3",
        pace: 1.0
      })
    });
  } catch (networkErr) {
    console.error("Network error calling Sarvam TTS:", networkErr);
    throw new Error("Network error calling TTS");
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Sarvam TTS error:", response.status, errorText);
    throw new Error(`Sarvam TTS failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("Sarvam TTS response received");

  if (!data.audios || !data.audios[0]) {
    console.error("No audio in TTS response:", data);
    throw new Error("No audio returned from Sarvam TTS");
  }

  // Decode base64 audio and play it
  const audioBase64 = data.audios[0];
  const audioBytes = atob(audioBase64);
  const audioArray = new Uint8Array(audioBytes.length);
  for (let i = 0; i < audioBytes.length; i++) {
    audioArray[i] = audioBytes.charCodeAt(i);
  }
  const audioBlob = new Blob([audioArray], { type: "audio/wav" });
  const audioUrl = URL.createObjectURL(audioBlob);

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    audio.onended = resolve;
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      reject(new Error("Audio playback failed"));
    };
    audio.play().catch(reject);
  });
}
