# English-Tamil Translation Chat App

A real-time chat application with automatic translation between English and Tamil, built with React, Node.js, MongoDB, and Socket.IO.

## Features

- Real-time messaging with automatic language translation
- User authentication and registration
- Private chat rooms
- Invite system for creating chats
- Language preference selection (English/Tamil)
- Persistent message history
- Beautiful, responsive UI

## Prerequisites

- Node.js (v18 or higher)
- MongoDB instance (local or Atlas)
- npm or yarn package manager


## Installation

1. Clone the repository:

```bash
git clone hhttps://github.com/devesh711/verbal-flip.git
cd verbal-flip
```

2. Strat FrontEnd:

```bash
npm install
npm run dev
```

3. Start the development server:

```bash
# Start the backend server
cd .\server\
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Project Structure

```
├── server/
│   └── index.ts         # Backend 
│   ├── .env             # server Environment variables
│   ├── package.json        # server dependencies
├── src/
│   ├── components/      # React components
│   ├── context/         # React context providers
│   ├── services/        # Service layer
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── .env                # Front end Environment variables
└── package.json        # Project dependencies
```

## Usage

1. Register a new account or log in with existing credentials
2. Select your preferred language (English or Tamil)
3. Create a new chat room by inviting users via email
4. Start chatting! Messages will be automatically translated based on user preferences

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Chat
- `POST /api/rooms/create` - Create new chat room
- `GET /api/rooms` - Get user's chat rooms
- `GET /api/messages/:roomId` - Get messages for a room

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Tailwind CSS
  - Socket.IO Client
  - Lucide React (icons)

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Socket.IO
  - JWT Authentication

## Development

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Vite for frontend development
- Tailwind CSS for styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - feel free to use this project for your own purposes.