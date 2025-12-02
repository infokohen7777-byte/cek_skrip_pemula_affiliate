import { GoogleGenAI } from "@google/genai";

interface ImagePart {
  mimeType: string;
  data: string;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateScript = async (
  productDetails: string,
  targetAudience: string,
  otherDetails: string,
  duration: number,
  mainImage: ImagePart,
  detailImage?: ImagePart,
  numberOfScripts: number = 1,
): Promise<string[]> => {
    
  const systemInstruction = `You are a professional affiliate video script generator called MESIN PEMBANGKIT SKRIP VIDEO AFFILIATE. Your task is to transform product photos and/or details into a ready-to-use video script. The script must be natural, not stiff, and not sound like an AI or a formal ad.

MANDATORY SCRIPT STRUCTURE (THE 4Ps):
1.  PERTANYAAN (Question): Start with a question that touches the potential buyer's problem, sparks curiosity, and feels relevant.
2.  PERNYATAAN (Statement): Follow up with a statement that describes the user's problem, making them feel "this is so me."
3.  PERINTAH (Command): Add a subtle command that guides and convinces without being pushy.
4.  PENGALAMAN (Experience): Narrate a usage experience as if you have actually used the product. It must be rational and not exaggerated or hyperbolic.

LANGUAGE RULES:
- Use a relaxed, everyday tone (Bahasa Santai).
- Do not use formal or standard language (Tidak formal, Tidak baku).
- The language should not sound like a brochure.

STRICT PROHIBITIONS - NEVER WRITE:
- "Sebagai AI"
- "Dalam video ini"
- "Kesimpulannya"
- AI technical jargon
- Stiff, report-like sentences.

INPUT HANDLING:
- You will receive a main product photo.
- You might also receive product details in the form of a second photo (e.g., a label, instructions) or text.
- Base the script on ALL available information. If only photos are provided, determine the product's function from the visuals using common sense. Do not invent extreme benefits.

OUTPUT FORMAT:
- Generate exactly ${numberOfScripts} unique script(s).
- The final output must be ONLY the video script narratives.
- You MUST separate each script with a unique delimiter: '---SCRIPT-SEPARATOR---'. Do not add any other text before the first script or after the last script.
- No headings (like "PERTANYAAN:").
- No bullet points.
- No technical formatting.
- No extra explanations.
- Each script should be suitable for a video duration of approximately ${duration} seconds.`;

  const userPrompt = `
    Main Product Photo: [Analyze the first image provided]
    Product Details: ${productDetails || (detailImage ? '[Analyze the second image provided for details]' : 'No text details provided.')}
    Target Audience: ${targetAudience || 'General audience.'}
    Other Details: ${otherDetails || 'None.'}
    
    Generate ${numberOfScripts} unique script variation(s) based on all these details.
    `;

  const contentParts: ({ text: string; } | { inlineData: { data: string; mimeType: string; }; })[] = [{ text: userPrompt }];

  contentParts.push({ inlineData: { data: mainImage.data, mimeType: mainImage.mimeType } });
  
  if (detailImage) {
    contentParts.push({ inlineData: { data: detailImage.data, mimeType: detailImage.mimeType } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: contentParts,
      },
      config: {
        systemInstruction: systemInstruction,
      },
    });

    if (response.text) {
      const scripts = response.text.split('---SCRIPT-SEPARATOR---').map(s => s.trim()).filter(Boolean);
      if (scripts.length > 0) {
        return scripts;
      }
    }
    
    throw new Error("No script generated in the API response or response was empty.");
  } catch (error) {
    console.error("Error calling Gemini API for script generation:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate script: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the API.");
  }
};

export const renderImage = async (prompt: string, image: ImagePart): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          },
        ],
      },
    });

    if (
      response.candidates &&
      response.candidates[0].content &&
      response.candidates[0].content.parts
    ) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No image data found in the API response.");
  } catch (error) {
    console.error("Error calling Gemini API for image rendering:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the API.");
  }
};