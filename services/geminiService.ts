
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, AppMode } from '../types';

const MODEL_NAME = "gemini-2.5-flash-preview-tts";

export const generateSpeech = async (
  text: string,
  mode: AppMode,
  voice1: VoiceName,
  voice2?: VoiceName
): Promise<string> => {
  if (!text.trim()) {
    throw new Error("Input text cannot be empty.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let speechConfig: any;

  if (mode === AppMode.SINGLE) {
    speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: voice1 },
      },
    };
  } else {
    if (!voice2) {
      throw new Error("Second voice is required for multi-speaker mode.");
    }
    speechConfig = {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          {
            speaker: 'Speaker A',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice1 }
            }
          },
          {
            speaker: 'Speaker B',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice2 }
            }
          }
        ]
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: speechConfig,
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from the API.");
    }

    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating speech.");
  }
};
