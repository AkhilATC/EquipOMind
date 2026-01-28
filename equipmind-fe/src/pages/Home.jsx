import React, { useState } from "react";
import ChatBubble from "./ChatBubble";
export default function Home() {
  const [activeMenu, setActiveMenu] = useState("datapipeline");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const API_URL = "http://0.0.0.0:5050/data-load";

  const handleChooseFile = (e) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setMsg("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMsg("❌ Please choose a file first");
      return;
    }

    try {
      setUploading(true);
      setMsg("");

      const formData = new FormData();
      // backend usually expects key name like "file"
      formData.append("file", selectedFile);

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMsg("✅ File uploaded successfully");
      } else {
        setMsg(`❌ Upload failed: ${data?.message || "Unknown error"}`);
      }
    } catch (err) {
      setMsg("❌ Server not reachable / Network error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>EquipMind</h2>

        <button
          style={activeMenu === "datapipeline" ? styles.activeBtn : styles.btn}
          onClick={() => setActiveMenu("datapipeline")}
        >
          📌 DataPipeline
        </button>

        <button
          style={activeMenu === "loadassets" ? styles.activeBtn : styles.btn}
          onClick={() => setActiveMenu("loadassets")}
        >
          📦 Load Assets
        </button>

        <button
          style={activeMenu === "config" ? styles.activeBtn : styles.btn}
          onClick={() => setActiveMenu("config")}
        >
          ⚙️ Configuration
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {activeMenu === "datapipeline" && (
          <div>
            <h1>📌 DataPipeline</h1>
            <p>Upload a CSV/XLSX file to backend</p>

            <div style={styles.uploadBox}>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleChooseFile}
              />

              {selectedFile && (
                <p style={{ marginTop: 10 }}>
                  Selected: <b>{selectedFile.name}</b>
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                style={styles.uploadBtn}
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>

              {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
            </div>
          </div>
        )}

        {activeMenu === "loadassets" && (
          <div>
            <h1>📦 Load Assets</h1>
            <p>Coming soon...</p>
          </div>
        )}

        {activeMenu === "config" && (
          <div>
            <h1>⚙️ Configuration</h1>
            <p>Coming soon...</p>
          </div>
        )}
      </div>
      <ChatBubble />
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial",
    background: "#f3f4f6",
  },
  sidebar: {
    width: "240px",
    background: "#111827",
    color: "white",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  logo: {
    marginBottom: "20px",
    fontSize: "20px",
  },
  btn: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    background: "#1f2937",
    color: "white",
    fontSize: "14px",
  },
  activeBtn: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    background: "#2563eb",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
  },
  uploadBox: {
    marginTop: "20px",
    padding: "20px",
    borderRadius: "12px",
    background: "white",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "450px",
  },
  uploadBtn: {
    marginTop: "15px",
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#111827",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
  },
};
