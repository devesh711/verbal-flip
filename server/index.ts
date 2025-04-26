import * as express from 'express';
import * as cors from 'cors';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const { 
  MONGODB_URI, 
  JWT_SECRET, 
  VITE_GOOGLE_CLIENT_ID, 
  VITE_GOOGLE_CLIENT_SECRET,
  GOOGLE_GEMINI_API_KEY,
} = process.env;

if (!MONGODB_URI || !JWT_SECRET || !VITE_GOOGLE_CLIENT_ID || !VITE_GOOGLE_CLIENT_SECRET || !GOOGLE_GEMINI_API_KEY) {
  console.error('Missing critical environment variables. Please check MONGODB_URI, JWT_SECRET, VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_SECRET, and GOOGLE_GEMINI_API_KEY.');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ------------------ Inline Translation Logic Begin ------------------

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: GOOGLE_GEMINI_API_KEY });

/**
 * Calls Google Gemini API with the given prompt and returns the translated text.
 * @param prompt The complete translation prompt.
 * @returns The translated text from Gemini.
 */
const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
    });
    // Assume the response contains a "text" field with the translated result.
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
const autoTranslate = async (
  text: string, 
  targetLang: "en" | "ta"
): Promise<{
  translatedText: string;
  detectedLanguage: "en" | "ta";
  isTranslated: boolean;
}> => {
  // Simple language detection based on presence of Tamil Unicode range.
  const tamilRange = /[\u0B80-\u0BFF]/;
  const detectedLanguage: "en" | "ta" = tamilRange.test(text) ? "ta" : "en";

  // If no translation is needed, return the original text.
  if (detectedLanguage === targetLang) {
    return {
      translatedText: text,
      detectedLanguage,
      isTranslated: false,
    };
  }

  // Construct a clear, complete prompt for Google Gemini.
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

// ------------------ Inline Translation Logic End ------------------

// MongoDB connection
mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/chat-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  preferredLanguage: { type: String, enum: ['en', 'ta'], default: 'en' },
  avatar: { type: String, default: 'https://i.pravatar.cc/150' }
});

// Room Schema
const roomSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: String,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  text: String,
  originalText: String,
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: String,
  timestamp: { type: Date, default: Date.now },
  translations: {
    en: String,
    ta: String
  },
  isTranslated: Boolean
});

const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const Message = mongoose.model('Message', messageSchema);

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET!);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, preferredLanguage } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      preferredLanguage,
      avatar: `https://i.pravatar.cc/150?u=${email}`
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET!,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Chat routes
app.post('/api/rooms/create', authenticateToken, async (req, res) => {
  try {
    const { inviteeEmail } = req.body;
    const invitee = await User.findOne({ email: inviteeEmail });
    
    if (!invitee) {
      return res.status(404).json({ error: 'User not found' });
    }

    const room = await Room.create({
      name: `Chat with ${invitee.name}`,
      participants: [req.user.id, invitee._id]
    });

    const populatedRoom = await Room.findById(room._id).populate('participants', '-password');
    
    io.emit('room:created', populatedRoom);
    res.json(populatedRoom);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({
      participants: req.user.id
    }).populate('participants', '-password');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

app.get('/api/messages/:roomId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate('senderId', '-password')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Socket.IO handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join:room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('message:send', async (messageData) => {
    try {
      // Compute translations for both English and Tamil using Gemini inline autoTranslate
      const enResult = await autoTranslate(messageData.text, 'en');
      const taResult = await autoTranslate(messageData.text, 'ta');
      
      // Define the default display text (using English as default)
      const defaultText = enResult.translatedText;
      
      // Explicitly assign each property so senderId is stored correctly
      const message = new Message({
        text: defaultText,
        originalText: messageData.text,
        senderId: messageData.senderId,
        roomId: messageData.roomId,
        timestamp: messageData.timestamp,
        translations: {
          en: enResult.translatedText,
          ta: taResult.translatedText,
        },
        isTranslated: enResult.isTranslated || taResult.isTranslated,
      });
  
      await message.save();
  
      // Populate sender details (excluding password) for proper UI mapping
      const populatedMessage = await Message.findById(message._id).populate('senderId', '-password');
      io.to(messageData.roomId).emit('message:received', populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});