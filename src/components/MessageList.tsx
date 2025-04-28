import React, { useEffect, useRef } from 'react';
import Message from './Message';
import { useChat } from '../context/ChatContext';

const MessageList: React.FC = () => {
  const { messages, currentRoom } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to latest message whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const roomMessages = messages
    .filter(msg => msg.roomId === currentRoom?.id)
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {roomMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
          <div className="text-5xl animate-bounce">💬</div>
          <p>No messages yet. Start the conversation!</p>
          <p className="text-sm max-w-md text-center">
            Messages in English will be automatically translated to Tamil,
            and vice versa. Try typing in either language.
          </p>
        </div>
      ) : (
        <>
          {roomMessages.map(message => (
            <Message
              key={message.id || `${message.senderId}-${message.timestamp}`}
              message={message}
            />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;