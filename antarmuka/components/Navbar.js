import Link from "next/link";
import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWalletContext";

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Navbar() {
  const { account, connecting, error, connect } = useWallet();
  const [userName, setUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    if (account) {
      const savedName = localStorage.getItem(`userName_${account.toLowerCase()}`);
      if (savedName) setUserName(savedName);
    }
  }, [account]);

  function handleSaveName() {
    if (account && tempName.trim()) {
      localStorage.setItem(`userName_${account.toLowerCase()}`, tempName.trim());
      setUserName(tempName.trim());
      setIsEditingName(false);
    }
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">{"{"}</span>
          Kelaz-King
          <span className="brand-mark">{"}"}</span>
        </Link>

        <nav className="nav-links">
          <Link href="/">Jelajahi Kursus</Link>
          <Link href="/create-course">Buat Kursus</Link>
          <Link href="/my-courses">Kursus Saya</Link>
        </nav>

        {account ? (
          <div className="wallet-pill" style={{ gap: "10px", alignItems: "center" }}>
            <span className="status-dot" />
            {isEditingName ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Masukkan nama"
                  style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                  }}
                />
                <button onClick={handleSaveName} style={{ padding: "4px 8px", borderRadius: "4px", background: "#4a6fa5", color: "white", border: "none", cursor: "pointer" }}>
                  ✓
                </button>
                <button onClick={() => { setIsEditingName(false); setTempName(userName); }} style={{ padding: "4px 8px", borderRadius: "4px", background: "#ccc", color: "black", border: "none", cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span>{userName || shortenAddress(account)}</span>
                <button onClick={() => { setIsEditingName(true); setTempName(userName); }} style={{ padding: "2px 6px", borderRadius: "4px", background: "transparent", border: "1px solid #ccc", cursor: "pointer", fontSize: "12px" }}>
                  Ubah Nama
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="wallet-btn" onClick={connect} disabled={connecting}>
            {connecting ? "Menghubungkan..." : "Hubungkan MetaMask"}
          </button>
        )}
      </div>
      {error && (
        <div className="container">
          <p className="alert alert-error" style={{ marginBottom: 12 }}>
            {error}
          </p>
        </div>
      )}
    </header>
  );
}
