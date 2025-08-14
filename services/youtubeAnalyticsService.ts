import { ChannelAnalytics } from '../types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This function is designed to get METADATA for a SINGLE channel.
// Calculations for streams/hours are now done in the frontend.
export const getChannelAnalytics = async (channel: string): Promise<Omit<ChannelAnalytics, 'hoursStreamed' | 'totalStreams'>> => {
  try {
    const prompt = `
      You are an expert YouTube data analyst. Your task is to provide specific metadata for the YouTube channel: "${channel}".
      Do NOT calculate any stream counts or durations. Only provide the channel's core, static information.
      Your response must be a single JSON object inside a JSON array.

      **DATA REQUIREMENTS:**
      Based on publicly available information for the channel "${channel}", find the following metrics:
      - \`id\`: A unique identifier for the channel (e.g., the channel handle).
      - \`channelName\`: The channel's display name.
      - \`channelHandle\`: The channel's handle (e.g., @handle).
      - \`profileImageUrl\`: The direct URL to the channel's profile picture. If it cannot be reliably found, provide an empty string "".
      - \`totalFollowers\`: The current number of subscribers.

      **IMPORTANT RULES:**
      - Provide exact numbers. Do not estimate or approximate.
      - Your entire response MUST be only the JSON array. No explanations. It must start with \`[\` and end with \`]\`.

      **Output Format (a single object inside a JSON array):**
      [
        {
          "id": "unique-id-for-the-channel",
          "channelName": "The Channel's Name",
          "channelHandle": "@channelhandle",
          "profileImageUrl": "https://url.to/profile.jpg",
          "totalFollowers": 12345
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const textResponse = response.text.trim();
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error("Raw AI Response for channel " + channel + ":", textResponse);
      throw new Error(`AI response for "${channel}" did not contain a valid JSON array.`);
    }

    const cleanedJsonText = jsonMatch[0];
    const data: Omit<ChannelAnalytics, 'sources' | 'hoursStreamed' | 'totalStreams'>[] = JSON.parse(cleanedJsonText);
    
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`AI response for "${channel}" was not a valid JSON array with data.`);
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter(Boolean);

    return {
      ...data[0],
      sources: sources || [],
    };

  } catch(error) {
    console.error(`Error fetching or parsing analytics for channel "${channel}":`, error);
    if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI data for "${channel}". Invalid JSON.`);
    }
    if (error instanceof Error) {
        // Re-throw with more context
        throw new Error(`Failed to generate analytics for "${channel}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while fetching data for "${channel}".`);
  }
};