import React, { useState } from 'react';
import { Message as MessageType } from '../types';
import { useChat } from '../context/ChatContext';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { currentUser } = useChat();

  const senderId =
    typeof message.senderId === 'object'
      ? message.senderId._id
      : message.senderId;

  const sender = typeof message.senderId === 'object'
    ? message.senderId
    : { _id: senderId, avatar: 'https://i.pravatar.cc/150' };

  const isOwnMessage = senderId?.toString() === currentUser?._id;

  const [showOriginal, setShowOriginal] = useState(false);

  const getMessageText = () => {
    const preferredLang = currentUser?.preferredLanguage || 'en';
    return showOriginal
      ? message.originalText
      : message.translations[preferredLang] || message.originalText;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleText = () => {
    if (message.isTranslated) {
      setShowOriginal((prev) => !prev);
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwnMessage && (
        <img
          src={sender.avatar || 'https://i.pravatar.cc/150'}
          alt="Avatar"
          className="h-8 w-8 rounded-full mr-2 self-end"
        />
      )}

      <div className="flex flex-col max-w-[70%]">
        <div
          onClick={toggleText}
          className={`px-4 py-3 rounded-2xl shadow-sm cursor-pointer break-words ${
            isOwnMessage
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
          }`}
        >
          <p className="text-sm break-words">{getMessageText()}</p>
          {message.isTranslated && (
            <div className={`text-xs mt-1 ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500'}`}>
              {showOriginal ? 'Showing original' : 'Translated'}
            </div>
          )}
        </div>

        <div className={`text-xs mt-1 text-gray-500 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {isOwnMessage && (
        <img
          src={currentUser?.avatar || 'https://i.pravatar.cc/150'}
          alt="Avatar"
          className="h-8 w-8 rounded-full ml-2 self-end"
        />
      )}
    </div>
  );
};

export default Message;