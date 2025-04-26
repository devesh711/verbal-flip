import React from 'react';
import { useChat } from '../context/ChatContext';
import { MessageSquare } from 'lucide-react';

const ChatRoomList: React.FC = () => {
  const { rooms, currentRoom, joinRoom } = useChat();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <MessageSquare className="mr-2" size={20} />
        Chat Rooms
      </h2>
      <div className="space-y-2">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => joinRoom(room.id)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              currentRoom?.id === room.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">{room.name}</div>
            <div className="text-sm text-gray-500">
              {room.participants.length} participants
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatRoomList;