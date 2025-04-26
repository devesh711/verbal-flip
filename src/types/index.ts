export interface Message {
  id: string;
  text: string;
  originalText: string;
  senderId: string;
  timestamp: number;
  isTranslated: boolean;
  translations: {
    en: string;
    ta: string;
  };
  roomId: string;
}

export interface User {
  id: string;
  name: string;
  preferredLanguage: 'en' | 'ta';
  avatar: string;
}

export interface Room {
  id: string;
  name: string;
  participants: string[];
}