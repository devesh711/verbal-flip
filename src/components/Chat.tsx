import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Users, LogOut, UserPlus, Menu, X } from 'lucide-react';

const Chat: React.FC = () => {
  const { rooms, currentRoom, createRoom, joinRoom } = useChat();
  const { user, logout } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRoom(inviteEmail);
      setInviteEmail('');
      setShowInvite(false);
    } catch (error) {
      alert('Failed to invite user');
    }
  };

  // Toggle sidebar for mobile view
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-4 h-full bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Mobile Header with Menu Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-3 p-2 rounded-lg bg-gray-100 text-gray-700"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          {currentRoom && (
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-lg mr-2">
                <MessageSquare size={18} className="text-indigo-600" />
              </div>
              <h2 className="font-semibold text-sm">{currentRoom.name}</h2>
            </div>
          )}
        </div>
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-8 h-8 rounded-full"
        />
      </div>

      {/* Sidebar - responsive */}
      <div className={`${showSidebar ? 'block' : 'hidden'} md:block md:col-span-1 border-r border-gray-200 bg-gray-50 flex flex-col h-full ${showSidebar ? 'fixed inset-0 z-40 w-3/4 md:w-auto md:static' : ''}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <h3 className="font-medium">{user?.name}</h3>
              <p className="text-sm text-gray-500">
                {user?.preferredLanguage === 'en' ? 'English' : 'தமிழ்'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 rounded-lg"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
          >
            <UserPlus size={18} />
            Invite to Chat
          </button>
        </div>

        <div className="p-4 space-y-2 flex-1 overflow-y-auto">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Users size={18} />
            Chat Rooms
          </h2>
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => {
                joinRoom(room.id);
                setShowSidebar(false); // Close sidebar on mobile after selection
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentRoom?.id === room.id
                  ? 'bg-indigo-50 text-indigo-700'
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

      {/* Main chat area */}
      <div className="md:col-span-3 flex flex-col h-full overflow-hidden">
        {/* Desktop header - hide on mobile */}
        {currentRoom && (
          <div className="hidden md:block p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <MessageSquare size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold">{currentRoom.name}</h2>
                <p className="text-sm text-gray-500">
                  Real-time translation enabled
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Message content area */}
        {currentRoom ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Scrollable message area */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <MessageList />
            </div>
            <div className="bg-white border-t border-gray-200">
              <MessageInput />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Welcome to Verbal Flip!
              </h3>
              <p className="text-gray-500 max-w-md">
                Select a chat room or invite someone to start a conversation.
                Messages will be automatically translated between English and Tamil.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Invite to Chat</h3>
            <form onSubmit={handleInvite}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;