import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/api/login`, {
        username: username.trim(),
        password: password.trim(),
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);

      onLogin(res.data.username);
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
    if (!token) return;

    try {
      const res = await axios.get(`${API}/api/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
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

  // ✅ DATE LABEL (Today / Yesterday / Date)
  const getDateLabel = (ts) => {
    const msgDate = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.toDateString() === d2.toDateString();

    if (isSameDay(msgDate, today)) return "Today";
    if (isSameDay(msgDate, yesterday)) return "Yesterday";

    return msgDate.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ SORT + GROUP
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const groupedMessages = sortedMessages.reduce((acc, msg) => {
    const label = getDateLabel(msg.timestamp);

    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);

    return acc;
  }, {});

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <div className="header-left">
          <img
            src={`/avatars/sachin.jpg`}
            alt="avatar"
            className="avatar"
          />
          <div>
            <div className="chat-with">{other}</div>
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

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="date-container">
            <div className="date-divider">{date}</div>

            {msgs.map((msg) => (
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

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

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