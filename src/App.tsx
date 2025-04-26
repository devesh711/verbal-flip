import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './components/Chat';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-indigo-50 flex flex-col p-4 md:p-8">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-indigo-900">Verbal Flip</h1>
            <p className="text-indigo-600">English ↔️ தமிழ் (Tamil) Translation</p>
          </header>
          
          <div className="flex-1 flex justify-center items-start">
            <div className="w-full max-w-3xl h-[80vh]">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <ChatProvider>
                        <Chat />
                      </ChatProvider>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </div>
          
          <footer className="mt-6 text-center text-sm text-gray-500">
            <p>© 2025 Verbal Flip</p>
            <p className="text-xs mt-1">
              Try writing in English or Tamil - messages will be automatically translated!
            </p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;