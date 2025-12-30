import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Generates speech for game announcements using the Gemini API.
 */
export const generateSpeech = async (text: string, voice: 'Kore' | 'Zephyr' = 'Kore'): Promise<string | null> => {
  // Use the API key provided in the environment
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API Key missing, skipping TTS");
    return null;
  }

  try {
    // Initializing the SDK with the required named parameter structure
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Sage kurz und knackig: ${text}` }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    // Extracting the audio bytes from the response
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Gemini TTS error:", error);
    return null;
  }
};