import { useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ThumbnailUpload({ value, onChange }) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG/JPG/WEBP).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Ukuran gambar terlalu besar. Gunakan gambar di bawah 5MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-thumbnail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      onChange(data.ipfsUrl);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      <p className="hint">
        Gambar diunggah ke IPFS (decentralized storage), hanya URL yang disimpan di blockchain.
      </p>
      {error && <p className="alert alert-error">{error}</p>}
      {uploading && <p className="alert">Mengunggah gambar ke IPFS...</p>}
      {value && (
        <img src={value} alt="Preview thumbnail" className="thumbnail-preview" />
      )}
    </div>
  );
}
