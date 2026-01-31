import React, { useEffect, useRef, useState } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";

export default function ChatBubble() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const esRef = useRef(null); // keep reference for closing

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || listening) return;

    const userText = input.trim();
    setInput("");

    // add user message
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);

    // add bot placeholder message
    const botId = Date.now();
    setMessages((prev) => [...prev, { id: botId, sender: "bot", text: "" }]);

    setListening(true);

    // close old connection if any
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setListening(false);
      alert("Token missing. Please login again.");
      return;
    }

    // ✅ Read saved session id (if any)
    const savedSessionId = localStorage.getItem("x_session_id") || "";

    const url = `http://0.0.0.0:5050/agent/chat?message=${encodeURIComponent(
      userText
    )}`;

    try {
      const es = new EventSourcePolyfill(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",

          // ✅ Send session id back to BE
          ...(savedSessionId ? { "x-session-id": savedSessionId } : {}),
        },
        heartbeatTimeout: 120000, // 2 min
      });

      esRef.current = es;

      // ✅ SESSION EVENT
      es.addEventListener("session", (e) => {
        try {
          const data = JSON.parse(e.data);

          // update state
          setSessionInfo(data);

          // ✅ store session_id for next requests
          if (data?.session_id) {
            localStorage.setItem("x_session_id", data.session_id);
          }

          console.log("SESSION:", data);
        } catch (err) {
          console.error("session parse error:", err, e.data);
        }
      });

      // ✅ MESSAGE EVENT (stream chunks)
      es.addEventListener("message", (e) => {
        try {
          const data = JSON.parse(e.data);
          const chunk = data?.text ?? "";

          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === botId);
            if (idx === -1) return prev;

            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              text: (copy[idx].text || "") + chunk,
            };
            return copy;
          });
        } catch (err) {
          console.error("message parse error:", err, e.data);
        }
      });

      // ✅ DONE EVENT
      es.addEventListener("done", (e) => {
        console.log("DONE:", e.data);
        setListening(false);

        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
      });

      // ✅ ERROR EVENT (custom)
      es.addEventListener("error", (e) => {
        console.error("SSE error event:", e);

        setListening(false);

        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
      });

      // low-level onerror (network issues)
      es.onerror = (err) => {
        console.error("SSE connection error:", err);

        setListening(false);

        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
      };
    } catch (err) {
      console.error("EventSourcePolyfill init error:", err);
      setListening(false);
    }
  };

  return (
    <div style={styles.chatWrapper}>
      <div style={styles.chatHeader}>
        EquiMind 🧠
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
    width: 340,
    height: 440,
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
