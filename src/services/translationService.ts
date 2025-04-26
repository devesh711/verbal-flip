import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });

/**
 * Calls the Google Gemini API with the given prompt and returns the translated text.
 * @param prompt The complete translation prompt.
 * @returns The translated text from Gemini.
 */
const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
    });
    // Assume the response contains a 'text' property with the translated text.
    return response.text || "";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "";
  }
};

/**
 * Automatically detects language and translates text using Google Gemini.
 * @param text The text to translate.
 * @param targetLang The target language ('en' or 'ta').
 * @returns Object containing the translated text, detected language, and translation flag.
 */
export const autoTranslate = async (
  text: string, 
  targetLang: "en" | "ta"
): Promise<{
  translatedText: string;
  detectedLanguage: "en" | "ta";
  isTranslated: boolean;
}> => {
  // Simple language detection based on presence of Tamil Unicode range
  const tamilRange = /[\u0B80-\u0BFF]/;
  const detectedLanguage: "en" | "ta" = tamilRange.test(text) ? "ta" : "en";

  // If no translation is needed, return the original text
  if (detectedLanguage === targetLang) {
    return {
      translatedText: text,
      detectedLanguage,
      isTranslated: false,
    };
  }

  // Construct a clear, complete prompt for Gemini
  const targetLanguageFull = targetLang === "en" ? "English" : "Tamil";
  const prompt = `Translate the following text into ${targetLanguageFull} while preserving its original tone, context, and meaning:

Text: "${text}"

Provide only the translated text in the response.`;

  const translatedText = await callGeminiAPI(prompt);

  return {
    translatedText: translatedText || text,
    detectedLanguage,
    isTranslated: Boolean(translatedText),
  };
};

module.exports = { autoTranslate };