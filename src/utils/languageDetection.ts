/**
 * Simple language detection utility
 * In a production app, you would use a more sophisticated library
 */

// Tamil unicode range (basic check)
const tamilRange = /[\u0B80-\u0BFF]/;

export const detectLanguage = (text: string): 'en' | 'ta' => {
  // Check if the text contains Tamil characters
  if (tamilRange.test(text)) {
    return 'ta';
  }
  // Default to English
  return 'en';
};