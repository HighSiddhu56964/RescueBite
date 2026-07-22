// Backup voice using ElevenLabs (used when Sarvam TTS fails or as premium option)
export async function elevenLabsSpeak(text) {
  const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID;
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

  console.log("ElevenLabs voiceId:", voiceId);
  console.log("ElevenLabs apiKey exists:", !!apiKey);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("ElevenLabs error:", response.status, errText);
    throw new Error("ElevenLabs failed: " + errText);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  return audio.play();
}
