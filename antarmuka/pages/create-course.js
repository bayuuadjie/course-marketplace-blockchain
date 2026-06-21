import { useState } from "react";
import { useRouter } from "next/router";
import { createCourse } from "konektor";
import { useWallet } from "../hooks/useWalletContext";
import ThumbnailUpload from "../components/ThumbnailUpload";
import { CATEGORIES } from "../components/SearchFilterBar";

export default function CreateCourse() {
  const { account, connect } = useWallet();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    contentURI: "",
    thumbnailURI: "",
    category: "Programming",
    priceInEth: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!account) {
      await connect();
      return;
    }

    if (!form.title || !form.priceInEth) {
      setMessage({ type: "error", text: "Judul dan harga wajib diisi." });
      return;
    }

    setSubmitting(true);
    try {
      await createCourse(form);
      setMessage({ type: "success", text: "Kursus berhasil dibuat dan tercatat di blockchain!" });
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message || "Gagal membuat kursus." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container form-page">
      <h1>Buat Kursus Baru</h1>
      <p className="sub">
        Data kursus akan disimpan permanen di smart contract. Pembeli mengirim ETH langsung ke
        alamat wallet Anda saat membeli akses.
      </p>

      {message && (
        <p className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Judul Kursus</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Contoh: Belajar Solidity dari Nol"
          />
        </div>

        <div className="field">
          <label>Kategori</label>
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.filter((c) => c !== "Semua").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Deskripsi</label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            placeholder="Jelaskan singkat isi kursus ini..."
          />
        </div>

        <div className="field">
          <label>Thumbnail Kursus</label>
          <ThumbnailUpload
            value={form.thumbnailURI}
            onChange={(dataUri) => setForm({ ...form, thumbnailURI: dataUri })}
          />
        </div>

        <div className="field">
          <label>Link Materi (URL / IPFS)</label>
          <input
            name="contentURI"
            value={form.contentURI}
            onChange={handleChange}
            placeholder="https://... atau ipfs://..."
          />
          <p className="hint">Link ini hanya akan terbuka untuk pembeli yang sudah memiliki akses.</p>
        </div>

        <div className="field">
          <label>Harga (ETH)</label>
          <input
            name="priceInEth"
            type="number"
            step="0.0001"
            min="0"
            value={form.priceInEth}
            onChange={handleChange}
            placeholder="0.05"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Memproses transaksi..." : account ? "Terbitkan Kursus" : "Hubungkan Wallet"}
        </button>
      </form>
    </main>
  );
}
