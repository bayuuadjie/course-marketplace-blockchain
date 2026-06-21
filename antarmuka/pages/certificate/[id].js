import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCertificateDetail, contractConfig } from "konektor";

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function CertificatePage() {
  const router = useRouter();
  const { id } = router.query;

  const [cert, setCert] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCertificateDetail(id)
      .then(setCert)
      .catch((err) => setError(err.message || "Sertifikat tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="container form-page">
        <p className="hint">Memuat sertifikat dari blockchain...</p>
      </main>
    );
  }

  if (error || !cert || cert.student === "0x0000000000000000000000000000000000000000") {
    return (
      <main className="container form-page">
        <p className="alert alert-error">{error || "Sertifikat tidak ditemukan."}</p>
      </main>
    );
  }

  return (
    <main className="container form-page" style={{ maxWidth: 760 }}>
      <div className="certificate-card">
        <div className="certificate-eyebrow">e-sertifikat penyelesaian kursus</div>
        <h1 className="certificate-title">{cert.courseTitle}</h1>
        <p className="certificate-sub">Sertifikat ini diberikan kepada</p>
        <div className="certificate-student">{shortenAddress(cert.student)}</div>
        <p className="certificate-sub">
          atas penyelesaian kursus yang diselenggarakan oleh pengajar{" "}
          <strong>{shortenAddress(cert.instructor)}</strong>
        </p>

        <div className="certificate-verify">
          <div>
            <span className="label">ID Sertifikat</span>
            <span className="value">#{cert.id}</span>
          </div>
          <div>
            <span className="label">Tanggal Terbit</span>
            <span className="value">{cert.issuedAt.toLocaleDateString("id-ID")}</span>
          </div>
          <div>
            <span className="label">Contract Address</span>
            <span className="value">{shortenAddress(contractConfig.address)}</span>
          </div>
        </div>

        <p className="hint" style={{ marginTop: 20 }}>
          Keabsahan sertifikat ini dapat diverifikasi siapa saja dengan memanggil fungsi{" "}
          <code>getCertificate({cert.id})</code> pada smart contract di atas — data tidak dapat
          diubah atau dipalsukan karena tersimpan permanen di blockchain.
        </p>
      </div>

      <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => window.print()}>
        Cetak / Simpan sebagai PDF
      </button>
    </main>
  );
}
