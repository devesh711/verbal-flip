import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send } from 'lucide-react';

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, currentUser } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      try {
        await sendMessage(message);
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto'; // Reset height
    e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height
  };

  const getPlaceholder = () => {
    return currentUser?.preferredLanguage === 'ta'
      ? 'தமிழில் தட்டச்சு செய்யவும்...'
      : 'Type in English...';
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-4 bg-white"
    >
      <div className="flex items-end space-x-2">
        <div className="flex-1 rounded-xl border-2 border-gray-200 bg-white focus-within:border-indigo-500 transition-colors">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInput}
            placeholder={getPlaceholder()}
            className="w-full px-3 py-2 focus:outline-none resize-none max-h-32 rounded-xl"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-3 rounded-full transition-all ${
            message.trim() 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          <Send size={20} />
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        {currentUser.preferredLanguage === 'en' 
          ? 'Your messages will be automatically translated to Tamil'
          : 'உங்கள் செய்திகள் தானாகவே ஆங்கிலத்தில் மொழிபெயர்க்கப்படும்'}
      </div>
    </form>
  );
};

export default MessageInput;