import React, { useState, useEffect, useRef } from "react";

export default function ChatBubble() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    // SSE connection
    const url = `http://0.0.0.0:5050/chat?msg=${encodeURIComponent(input)}`;
    const evtSource = new EventSource(url);

    setListening(true);

    let botMessage = "";

    evtSource.onmessage = (e) => {
      if (e.data === "[DONE]") {
        // finish
        setMessages((prev) => [...prev, { sender: "bot", text: botMessage }]);
        evtSource.close();
        setListening(false);
      } else {
        botMessage += e.data + " ";
      }
    };

    evtSource.onerror = (err) => {
      console.error(err);
      evtSource.close();
      setListening(false);
    };

    setInput("");
  };

  return (
    <div style={styles.chatWrapper}>
      <div style={styles.chatHeader}>Equip🧠O</div>

      <div style={styles.chatBody}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={m.sender === "user" ? styles.userMsg : styles.botMsg}
          >
            {m.text}
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
    height: 400,
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
  },
  botMsg: {
    alignSelf: "flex-start",
    background: "#f3f4f6",
    padding: 8,
    borderRadius: 8,
    maxWidth: "80%",
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
