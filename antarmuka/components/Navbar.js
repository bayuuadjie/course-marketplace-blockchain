import Link from "next/link";
import { useWallet } from "../hooks/useWalletContext";

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Navbar() {
  const { account, connecting, error, connect } = useWallet();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">{"{"}</span>
          Kelaskan
          <span className="brand-mark">{"}"}</span>
        </Link>

        <nav className="nav-links">
          <Link href="/">Jelajahi Kursus</Link>
          <Link href="/create-course">Buat Kursus</Link>
          <Link href="/my-courses">Kursus Saya</Link>
        </nav>

        {account ? (
          <div className="wallet-pill">
            <span className="status-dot" />
            {shortenAddress(account)}
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
