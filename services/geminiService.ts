
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

// Factory function to ensure the latest API key is used directly from process.env
export const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Main Petrological Advisor using Gemini 3 Pro with thinking mode.
 */
export async function getPetrologicalAdvice(
  messages: ChatMessage[], 
  image?: string
): Promise<string> {
  const ai = getAIClient();
  
  // Fix for line 25: Properly construct contents with typed parts to allow both text and inlineData
  const contents = messages.map((m, index) => {
    // Explicitly typing parts as any[] or a union to allow mixed content types
    const parts: any[] = [{ text: m.content }];
    
    // If an image is provided, attach it to the most recent user message
    if (image && index === messages.length - 1 && m.role === 'user') {
      const mimeType = image.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: image.split(',')[1]
        }
      });
    }
    
    return {
      role: m.role,
      parts
    };
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents,
    config: {
      systemInstruction: `You are Molasse Mentor, an expert geological AI architect and senior sedimentary petrologist. 
      Analyze petrographic data, thin sections, geochemistry, and geochronology from foreland basins.
      Tone: academic, precise, formal, publication-grade.
      Always include Tectonic Setting, Basin Position, Unroofing Phase, Depositional Environment, and Provenance Type in your final interpretation.
      For Geochronology, correlate U-Pb (crystallization/inheritance) and Ar-Ar (cooling) ages with specific tectonic cycles and orogenic unroofing sequences.`,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  // response.text is a property, not a method
  return response.text || "I was unable to synthesize an interpretation at this time.";
}

/**
 * Quick analysis for lab modules using Gemini 3 Flash.
 * Includes search grounding sources in the output as required.
 */
export async function analyzeLabData(type: string, data: any): Promise<string> {
  const ai = getAIClient();
  
  let customPrompt = `Analyze this ${type} geological data and provide a concise petrological summary: ${JSON.stringify(data)}`;
  
  if (type === 'Geochronology Interpretation') {
    customPrompt = `As Molasse Mentor, interpret the following geochronology dataset: ${JSON.stringify(data)}. 
    Task: 
    1. Interpret U-Pb and Ar-Ar dating results (with provided uncertainties).
    2. Correlate ages with orogenic unroofing phases (Sedimentary Cover, Metamorphic Veneer, Crystalline Core). 
    3. Provide precise temporal constraints for major tectonic events (e.g. onset of collision, peak metamorphism, rapid exhumation).
    4. Discuss the lag-time if applicable between source cooling and deposition.
    Output: Publication-style reasoning with a focus on temporal basin dynamics.`;
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: customPrompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  const text = response.text || "";
  
  // Extract and list sources from grounding metadata as per guidelines
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = groundingChunks?.map(c => c.web?.uri).filter(Boolean) as string[];

  if (sources && sources.length > 0) {
    const sourceLinks = sources.map(url => `\n- [${url}](${url})`).join('');
    return `${text}\n\n**Sources:**${sourceLinks}`;
  }
  
  return text;
}

/**
 * Image editing using Gemini 2.5 Flash Image.
 * Iterates through response parts to find the generated image.
 */
export async function editPetrographicImage(image: string, prompt: string): Promise<string | undefined> {
  const ai = getAIClient();
  const mimeType = image.match(/data:(.*?);/)?.[1] || 'image/jpeg';
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: image.split(',')[1], mimeType: mimeType } },
        { text: prompt }
      ]
    }
  });

  // Iterate through parts to find the image part
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
}

/**
 * Search grounding for recent geological news or data.
 * Always extracts URLs from groundingChunks.
 */
export async function searchGeologicalContext(query: string) {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: { tools: [{ googleSearch: {} }] }
  });
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  return {
    text: response.text,
    sources: groundingChunks?.map(c => c.web?.uri).filter(Boolean) || []
  };
}
