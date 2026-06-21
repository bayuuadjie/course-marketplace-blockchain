import { useState } from "react";

const MAX_SIZE_BYTES = 250 * 1024; // 250KB - batas wajar agar transaksi tidak terlalu berat

export default function ThumbnailUpload({ value, onChange }) {
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG/JPG/WEBP).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Ukuran gambar terlalu besar. Gunakan gambar di bawah 250KB.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result); // hasilnya data URI base64
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} />
      <p className="hint">
        Gambar disimpan langsung di blockchain (base64), maksimal 250KB. Alternatif: tempel URL
        gambar di kolom &quot;Link Materi&quot; jika ingin lebih ringan.
      </p>
      {error && <p className="alert alert-error">{error}</p>}
      {value && (
        <img src={value} alt="Preview thumbnail" className="thumbnail-preview" />
      )}
    </div>
  );
}
