import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API}/api/login`, { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      onLogin(res.data.username);
    } catch {
      setError("Invalid credentials. Try again.");
    }
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
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button className="login-btn" onClick={handleLogin}>
          Sign In
        </button>

        <p className="hint">user1 or user2 / Apple@1698</p>
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

  // ✅ CLEAN: no headers outside
  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages(res.data);
    } catch {
      console.error("Failed to fetch messages");
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
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/api/messages`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setText("");
      fetchMessages();
    } catch {
      console.error("Failed to send");
    }

    setLoading(false);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [username, setUsername] = useState(
    localStorage.getItem("username") || null
  );

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