import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatArea from './views/chatbot/Chat/ChatArea';
import Login from './views/chatbot/auth/Login';
import NotFound from './views/chatbot/NotFound';


function App() {
  const token = localStorage.getItem('auth-token');

  return (
    <>
      <Routes>
        {/* Chat routes */}
        <Route path="/chatbot/chat" element={<ChatArea />} />

        {/* Fallback or invalid route */}
        <Route path="/chatbot" element={<NotFound />} />

        {/* Auth route */}
        {!token && <Route path="/auth/login" element={<Login />} />}

        {/* Redirect logic */}
        <Route
          path="/"
          element={
            !token ? (
              <Navigate to="/auth/login" replace />
            ) : (
              <Navigate to="/chatbot/chat" replace />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
