import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

// ✅ Axios interceptor (BEST PRACTICE)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/api/login`, {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);

      onLogin(res.data.username); // ✅ triggers UI switch immediately
    } catch (err) {
      setError("Invalid credentials. Try again.");
      console.error("Login error:", err.response?.data || err.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">💬</div>
        <h1>Coding App</h1>
        <p className="login-subtitle">Sign in to continue</p>

        {error && <div className="error-msg">{error}</div>}

        <input
          className="input-field"
          placeholder="Username"
          value={username}
          disabled={loading}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}

function Chat({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const other = username === "user1" ? "Prajakta" : "Sachin";

  const fetchMessages = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // ✅ prevents first-time failure

    try {
      const res = await axios.get(`${API}/api/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      await axios.post(`${API}/api/messages`, { text });
      setText("");
      fetchMessages();
    } catch (err) {
      console.error("Send error:", err.response?.data || err.message);
    }

    setLoading(false);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <div className="header-left">
          <div className="avatar">
            <img src={`/avatars/sachin.jpg`} alt="avatar" className="avatar" />
          </div>
          <div>
            <div className="chat-with">{other}</div>
            <div className="online-status">● Online</div>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="no-msgs">No messages yet. Say hello! 👋</div>
        )}

        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message-row ${
              msg.sender === username ? "sent" : "received"
            }`}
          >
            <div
              className={`bubble ${
                msg.sender === username
                  ? "bubble-sent"
                  : "bubble-received"
              }`}
            >
              <span className="msg-text">{msg.text}</span>
              <span className="msg-time">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="input-bar">
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || !text.trim()}
        >
          {loading ? "..." : "➤"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState(null);

  // ✅ FIX: initialize properly on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUsername(null);
  };

  return username ? (
    <Chat username={username} onLogout={handleLogout} />
  ) : (
    <Login onLogin={setUsername} />
  );
}