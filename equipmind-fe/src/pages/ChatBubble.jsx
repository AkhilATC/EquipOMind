import React, { useState, useEffect, useRef } from "react";

export default function ChatBubble() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || listening) return;

    const userText = input;
    setInput("");

    // add user msg
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);

    // placeholder bot msg
    const botId = Date.now();
    setMessages((prev) => [...prev, { id: botId, sender: "bot", text: "" }]);

    setListening(true);
    const token = localStorage.getItem("token"); // or "access_token"
    if (!token) {
        throw new Error("Token not found in localStorage. Please login again.");
    } 
    try {
      const res = await fetch("http://0.0.0.0:5050/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      // SSE parser state
      let currentEvent = "message";
      let currentDataLines = [];

      const flushEvent = () => {
        if (!currentDataLines.length) return;

        const rawData = currentDataLines.join("\n");

        try {
          const parsed = JSON.parse(rawData);

          if (currentEvent === "session") {
            setSessionInfo(parsed);
          }

          if (currentEvent === "message") {
            const chunk = parsed?.text ?? "";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botId ? { ...m, text: (m.text || "") + chunk } : m
              )
            );
          }

          if (currentEvent === "done") {
            setListening(false);
          }

          if (currentEvent === "error") {
            console.error("Server error:", parsed);
            setListening(false);
          }
        } catch (err) {
          console.error("SSE JSON parse error:", err, rawData);
        }

        // reset for next event
        currentEvent = "message";
        currentDataLines = [];
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split into SSE messages by blank line
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              currentDataLines.push(line.replace("data:", "").trim());
            }
          }

          // one event completed
          flushEvent();
        }
      }

      setListening(false);
    } catch (err) {
      console.error("Fetch SSE error:", err);
      setListening(false);
    }
  };

  return (
    <div style={styles.chatWrapper}>
      <div style={styles.chatHeader}>
        Equip🧠O
        {sessionInfo?.session_id ? (
          <div style={styles.sessionText}>Session: {sessionInfo.session_id}</div>
        ) : null}
      </div>

      <div style={styles.chatBody}>
        {messages.map((m, idx) => (
          <div
            key={m.id || idx}
            style={m.sender === "user" ? styles.userMsg : styles.botMsg}
          >
            {m.text || (m.sender === "bot" && listening ? "..." : "")}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.chatInputWrapper}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={styles.chatInput}
          disabled={listening}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button onClick={handleSend} style={styles.sendBtn} disabled={listening}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatWrapper: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 320,
    height: 420,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 1000,
    fontFamily: "Arial",
  },
  chatHeader: {
    background: "#2563eb",
    color: "white",
    padding: 10,
    fontWeight: "bold",
  },
  sessionText: {
    fontSize: 11,
    opacity: 0.9,
    marginTop: 4,
    fontWeight: "normal",
  },
  chatBody: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  userMsg: {
    alignSelf: "flex-end",
    background: "#2563eb",
    color: "white",
    padding: 8,
    borderRadius: 8,
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
  },
  botMsg: {
    alignSelf: "flex-start",
    background: "#f3f4f6",
    padding: 8,
    borderRadius: 8,
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
  },
  chatInputWrapper: {
    display: "flex",
    borderTop: "1px solid #ddd",
  },
  chatInput: {
    flex: 1,
    padding: 8,
    border: "none",
    outline: "none",
  },
  sendBtn: {
    padding: "0 15px",
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};
