import { useState, useRef } from "react";

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      // Request microphone with settings that work best for STT
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,        // mono
          sampleRate: 16000,      // 16kHz - Sarvam's preferred rate
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Pick the best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "";

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      console.log("Recording with MIME type:", mediaRecorder.mimeType);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // collect data every 100ms
      setRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      if (err.name === "NotAllowedError") {
        alert("Microphone access was denied. Please click the microphone icon in your browser's address bar and allow access, then try again.");
      } else if (err.name === "NotFoundError") {
        alert("No microphone found. Please connect a microphone and try again.");
      } else {
        alert("Could not access microphone: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        reject(new Error("No active recording"));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        // Stop all microphone tracks to release the mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Strip codec suffix (e.g. "audio/webm;codecs=opus" -> "audio/webm")
        // Sarvam STT rejects MIME types with codec parameters
        const rawMime = mediaRecorderRef.current.mimeType || "audio/webm";
        const mimeType = rawMime.split(";")[0];
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log("Recording stopped. Blob size:", audioBlob.size, "type:", audioBlob.type);

        if (audioBlob.size < 1000) {
          reject(new Error("Recording too short or empty - please speak clearly and hold the button longer"));
          return;
        }

        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
      setRecording(false);
    });
  };

  return { recording, startRecording, stopRecording };
}
