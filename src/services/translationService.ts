import { detectLanguage } from '../utils/languageDetection';

// Simple mock translations
// In a real app, you would use a translation API
const englishToTamilDict: Record<string, string> = {
  'hello': 'வணக்கம்',
  'how are you': 'நீங்கள் எப்படி இருக்கிறீர்கள்',
  'good morning': 'காலை வணக்கம்',
  'good night': 'இனிய இரவு',
  'thank you': 'நன்றி',
  'welcome': 'வரவேற்கிறோம்',
  'yes': 'ஆம்',
  'no': 'இல்லை',
  'what is your name': 'உங்கள் பெயர் என்ன',
  'my name is': 'என் பெயர்',
  'how is the weather': 'வானிலை எப்படி உள்ளது',
  'i like this app': 'எனக்கு இந்த ஆப் பிடித்துள்ளது',
  'nice to meet you': 'உங்களை சந்தித்ததில் மகிழ்ச்சி',
  'what are you doing': 'நீங்கள் என்ன செய்கிறீர்கள்',
  'i am learning tamil': 'நான் தமிழ் கற்றுக்கொள்கிறேன்',
  'see you later': 'பின்னர் பார்க்கலாம்',
};

const tamilToEnglishDict: Record<string, string> = {
  'வணக்கம்': 'hello',
  'நீங்கள் எப்படி இருக்கிறீர்கள்': 'how are you',
  'காலை வணக்கம்': 'good morning',
  'இனிய இரவு': 'good night',
  'நன்றி': 'thank you',
  'வரவேற்கிறோம்': 'welcome',
  'ஆம்': 'yes',
  'இல்லை': 'no',
  'உங்கள் பெயர் என்ன': 'what is your name',
  'என் பெயர்': 'my name is',
  'வானிலை எப்படி உள்ளது': 'how is the weather',
  'எனக்கு இந்த ஆப் பிடித்துள்ளது': 'i like this app',
  'உங்களை சந்தித்ததில் மகிழ்ச்சி': 'nice to meet you',
  'நீங்கள் என்ன செய்கிறீர்கள்': 'what are you doing',
  'நான் தமிழ் கற்றுக்கொள்கிறேன்': 'i am learning tamil',
  'பின்னர் பார்க்கலாம்': 'see you later',
};

/**
 * Translates text from one language to another
 * This is a mock implementation - in a real app, you would call a translation API
 */
export const translateText = async (
  text: string,
  sourceLang: 'en' | 'ta',
  targetLang: 'en' | 'ta'
): Promise<string> => {
  if (sourceLang === targetLang) {
    return text; // No translation needed
  }

  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

  if (sourceLang === 'en' && targetLang === 'ta') {
    return englishToTamilDict[text.toLowerCase()] || `[தமிழில்: ${text}]`;
  } else if (sourceLang === 'ta' && targetLang === 'en') {
    return tamilToEnglishDict[text] || `[Translated: ${text}]`;
  }

  return text; // Fallback
};

/**
 * Automatically detects language and translates to target language
 */
export const autoTranslate = async (
  text: string, 
  targetLang: 'en' | 'ta'
): Promise<{
  translatedText: string;
  detectedLanguage: 'en' | 'ta';
  isTranslated: boolean;
}> => {
  const detectedLanguage = detectLanguage(text);
  
  if (detectedLanguage === targetLang) {
    return {
      translatedText: text,
      detectedLanguage,
      isTranslated: false
    };
  }
  
  const translatedText = await translateText(text, detectedLanguage, targetLang);
  
  return {
    translatedText,
    detectedLanguage,
    isTranslated: true
  };
};

module.exports = { autoTranslate };