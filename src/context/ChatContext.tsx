import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Message, Room, User } from '../types';

interface ChatContextType {
  messages: Message[];
  rooms: Room[];
  currentRoom: Room | null;
  currentUser: User | null;
  sendMessage: (text: string) => Promise<void>;
  createRoom: (inviteeEmail: string) => Promise<void>;
  joinRoom: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message:received', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for new rooms
    socket.on('room:created', (room: Room) => {
      setRooms((prev) => [...prev, room]);
    });

    // Cleanup socket events on unmount
    return () => {
      socket.off('message:received');
      socket.off('room:created');
    };
  }, [socket]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!socket) return;

    try {
      // Join the room via socket
      socket.emit('join:room', roomId);

      // Fetch messages for the room
      const response = await fetch(`http://localhost:3000/api/messages/${roomId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const msgs = await response.json();
      setMessages(msgs);

      // Set the current room
      const room = rooms.find((r) => r.id === roomId);
      setCurrentRoom(room || null);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }, [socket, rooms]);

  const sendMessage = async (text: string) => {
    if (!socket || !currentRoom || !user) return;
    const senderId = user.id || user._id;
    const messageData = {
      text,
      originalText: text,
      senderId,
      roomId: currentRoom.id,
      timestamp: new Date(),
      translations: {
        en: '',
        ta: ''
      }
    };

    socket.emit('message:send', messageData);
  };

  const createRoom = async (inviteeEmail: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ inviteeEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const room = await response.json();
      setRooms(prev => [...prev, room]);
      joinRoom(room.id);
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      rooms,
      currentRoom,
      sendMessage,
      createRoom,
      joinRoom,
      currentUser: user
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};