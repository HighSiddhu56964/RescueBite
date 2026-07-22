import { SYSTEM_PROMPT } from "./systemPrompt";

export async function askSarvamLLM(messages) {
  try {
    const dynamicSystemContext = messages
      .filter(m => m.role === "system")
      .map(m => m.content)
      .join("\n\n");
    const combinedSystemPrompt = [SYSTEM_PROMPT, dynamicSystemContext]
      .filter(Boolean)
      .join("\n\n");

    const sanitizedMessages = messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role,
        content: (m.content || "")
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<think>[\s\S]*/gi, "")
          .trim() || m.content
      }))
      .filter(m => m.content.length > 0);

    // Sarvam strict constraint: First message after system MUST be a 'user' message.
    const firstUserIndex = sanitizedMessages.findIndex(m => m.role === "user");
    const orderedMessages = firstUserIndex >= 0 
      ? sanitizedMessages.slice(firstUserIndex) 
      : sanitizedMessages;

    // Add a small system note to the last message to enforce formatting without strict json
    if (orderedMessages.length > 0) {
      const lastMsg = orderedMessages[orderedMessages.length - 1];
      if (lastMsg.role === "user") {
        lastMsg.content = `${lastMsg.content}\n\n[System Note: Provide your answer with "Risk Level:" and "First Aid:". Respond in the exact same language as this user's input.]`;
      }
    }

    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": import.meta.env.VITE_SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: "sarvam-m",
        messages: [
          { role: "system", content: combinedSystemPrompt },
          ...orderedMessages
        ],
        max_tokens: 512,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("LLM API error:", text);
      return null; // Return null to trigger fallback
    }

    const data = await response.json();
    console.log("RAW AI RESPONSE:", data);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      let replyStr = data.choices[0].message.content || "";
      
      // Strip think blocks
      replyStr = replyStr.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "").trim();

      if (replyStr) {
         return replyStr;
      }
    }

    return null;

  } catch (err) {
    console.error("LLM ERROR:", err);
    return null;
  }
}
