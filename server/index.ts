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
dotenv.config();

const { 
  MONGODB_URI, 
  JWT_SECRET, 
  VITE_GOOGLE_CLIENT_ID, 
  VITE_GOOGLE_CLIENT_SECRET,
} = process.env;

if (!MONGODB_URI || !JWT_SECRET || !VITE_GOOGLE_CLIENT_ID || !VITE_GOOGLE_CLIENT_SECRET) {
  console.error('Missing critical environment variables. Please check MONGODB_URI, JWT_SECRET, VITE_GOOGLE_CLIENT_ID, and VITE_GOOGLE_CLIENT_SECRET.');
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

// Inline translation functions

function detectLanguage(text: string): 'en' | 'ta' {
  const tamilRange = /[\u0B80-\u0BFF]/;
  return tamilRange.test(text) ? 'ta' : 'en';
}

async function translateText(
  text: string,
  sourceLang: 'en' | 'ta',
  targetLang: 'en' | 'ta'
): Promise<string> {
  if (sourceLang === targetLang) {
    return text; // No translation needed
  }

  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

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

  if (sourceLang === 'en' && targetLang === 'ta') {
    return englishToTamilDict[text.toLowerCase()] || `[தமிழில்: ${text}]`;
  } else if (sourceLang === 'ta' && targetLang === 'en') {
    return tamilToEnglishDict[text] || `[Translated: ${text}]`;
  }

  return text;
}

async function autoTranslate(
  text: string,
  targetLang: 'en' | 'ta'
): Promise<{
  translatedText: string;
  detectedLanguage: 'en' | 'ta';
  isTranslated: boolean;
}> {
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
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app')
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
  }
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
    const verified = jwt.verify(token, process.env.JWT_SECRET!);
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
      process.env.JWT_SECRET!,
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
      process.env.JWT_SECRET!,
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

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join:room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('message:send', async (messageData) => {
    try {
      // Compute translations for both English and Tamil
      const enResult = await autoTranslate(messageData.text, 'en');
      const taResult = await autoTranslate(messageData.text, 'ta');
      
      // Define the default display text (we use English here as default)
      const defaultText = enResult.translatedText;
      
      // Explicitly assign each property to ensure senderId is stored correctly
      const message = new Message({
        text: defaultText,
        originalText: messageData.text,
        senderId: messageData.senderId,  // explicitly include senderId
        roomId: messageData.roomId,
        timestamp: messageData.timestamp,
        translations: {
          en: enResult.translatedText,
          ta: taResult.translatedText,
        },
        isTranslated: enResult.isTranslated || taResult.isTranslated,
      });
  
      await message.save();
  
      // Populate sender details (excluding the password) so UI can map the message to the correct user
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