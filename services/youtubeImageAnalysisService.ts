import { GoogleGenAI, Type } from "@google/genai";
import { VideoDetails } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ImageAnalysisResult {
    videos: VideoDetails[];
    totalFollowers?: number;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    totalFollowers: {
      type: Type.NUMBER,
      description: 'The total number of subscribers for the channel, if visible in the image.'
    },
    videos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'The full title of the video.',
          },
          publishedAt: {
            type: Type.STRING,
            description: 'The estimated absolute date of publication in YYYY-MM-DD format.',
          },
          duration: {
            type: Type.STRING,
            description: 'The duration of the video in HH:MM:SS or MM:SS format.',
          },
          views: {
            type: Type.NUMBER,
            description: 'The number of views for the video. Extract numbers like "1,2 k vues" as 1200 or "1,2 M de vues" as 1200000.'
          }
        },
        required: ["title", "publishedAt", "duration", "views"],
      },
    },
  },
  required: ["videos"],
};


export const analyzeVideosFromImage = async (imageBase64: string, mimeType: string): Promise<ImageAnalysisResult> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      You are an expert at analyzing screenshots of YouTube channel video pages, which are in French.
      From the provided image, extract the following information:
      - totalFollowers: The channel's total subscriber count. This is a single number for the whole channel.
      - For EACH video listing:
        - title: The full title of the video.
        - publishedAt: The publication date. The text in the image is relative (e.g., "Diffusé il y a 2 mois", "il y a 1 an"). You MUST convert this relative time into an absolute date in "YYYY-MM-DD" format. Assume today's date is ${today}.
        - duration: The duration of the video, formatted as HH:MM:SS or MM:SS.
        - views: The number of views. Convert French text like "1,2 k vues" to 1200, "1 M de vues" to 1000000, and "123 vues" to 123.

      Your response must be a JSON object that strictly adheres to the provided schema.
      Ignore any content that is not a video, such as channel headers (except for totalFollowers), tabs, or YouTube Shorts.
    `;
    
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };
    
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const jsonResponse = JSON.parse(response.text);

    if (!jsonResponse || !Array.isArray(jsonResponse.videos)) {
        throw new Error("AI response did not contain a valid 'videos' array.");
    }

    return {
        videos: jsonResponse.videos,
        totalFollowers: jsonResponse.totalFollowers
    };

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    if (error instanceof Error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image analysis.");
  }
};
