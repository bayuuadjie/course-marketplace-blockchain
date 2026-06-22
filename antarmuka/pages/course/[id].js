import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useWallet } from "../../hooks/useWalletContext";
import { fetchAllCourses, buyCourse, hasPurchasedCourse, rateCourse, hasRatedCourse, issueCertificate, getCertificateId } from "konektor";
import { RatingDisplay } from "../../components/RatingStars";
import { getDisplayName } from "../../utils/userHelpers";

const FALLBACK_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23F1E9D8'/><text x='50%' y='55%' font-size='48' text-anchor='middle' fill='%235C6470'>?</text></svg>`
  );

export default function CourseDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { account, connect } = useWallet();
  const [course, setCourse] = useState(null);
  const [instructorName, setInstructorName] = useState("");
  const [isOwned, setIsOwned] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [certId, setCertId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [rating, setRating] = useState(false);
  const [issuingCert, setIssuingCert] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const courses = await fetchAllCourses();
        const found = courses.find(c => c.id === id);
        if (!found) {
          router.push("/");
          return;
        }
        setCourse(found);
        setInstructorName(getDisplayName(found.instructor));

        if (account) {
          const owned = await hasPurchasedCourse(id, account);
          setIsOwned(owned);
          const rated = await hasRatedCourse(id, account);
          setHasRated(rated);
          const certificateId = await getCertificateId(id, account);
          if (certificateId !== "0") {
            setCertId(certificateId);
          }
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, account]);

  async function handleBuy() {
    if (!account) {
      await connect();
      return;
    }
    setBuying(true);
    try {
      await buyCourse(course.id, course.priceWei);
      setMessage({ type: "success", text: "Berhasil membeli kursus!" });
      const owned = await hasPurchasedCourse(id, account);
      setIsOwned(owned);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message });
    } finally {
      setBuying(false);
    }
  }

  async function handleRate() {
    if (!selectedStars) return;
    setRating(true);
    try {
      await rateCourse(course.id, selectedStars);
      setMessage({ type: "success", text: "Rating berhasil dikirim!" });
      setHasRated(true);
      const courses = await fetchAllCourses();
      setCourse(courses.find(c => c.id === id));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message });
    } finally {
      setRating(false);
    }
  }

  async function handleIssueCertificate() {
    setIssuingCert(true);
    try {
      await issueCertificate(course.id);
      const certificateId = await getCertificateId(id, account);
      setCertId(certificateId);
      setMessage({ type: "success", text: "Sertifikat berhasil dibuat!" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message });
    } finally {
      setIssuingCert(false);
    }
  }

  if (loading) return <main className="container"><p className="hint">Memuat...</p></main>;

  if (!course) return <main className="container"><p className="hint">Kursus tidak ditemukan</p></main>;

  return (
    <main className="container">
      <button onClick={() => router.push("/")} className="btn-primary" style={{ marginTop: "20px",marginBottom: "20px" }}>
        ← Kembali ke Daftar Kursus
      </button>

      {message && (
        <p className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: "20px" }}>
          {message.text}
        </p>
      )}

      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 400px" }}>
          <img
            src={course.thumbnailURI || FALLBACK_THUMB}
            alt={course.title}
            style={{ width: "100%", borderRadius: "8px", objectFit: "cover", aspectRatio: "4/3" }}
            onError={(e) => (e.target.src = FALLBACK_THUMB)}
          />
        </div>

        <div style={{ flex: "1 1 300px" }}>
          <span className="category-badge" style={{ marginBottom: "10px", display: "inline-block" }}>{course.category}</span>
          <h1 style={{ margin: "10px 0" }}>{course.title}</h1>
          <RatingDisplay average={course.averageRating} count={course.ratingCount} />
          <p style={{ margin: "20px 0", lineHeight: "1.6" }}>{course.description}</p>

          <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#f8f6f0", borderRadius: "8px" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>{course.priceEth} ETH</div>
            <div style={{ color: "#666" }}>
              Pengajar: {instructorName}
            </div>
          </div>

          {account && course.instructor.toLowerCase() === account.toLowerCase() ? (
            <div className="badge-owned" style={{ textAlign: "center", padding: "10px" }}>Ini adalah kursus Anda</div>
          ) : isOwned ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span className="badge-owned" style={{ textAlign: "center", padding: "10px" }}>✓ Kursus sudah Anda miliki</span>
              {course.contentURI && (
                <a href={course.contentURI} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textAlign: "center" }}>
                  Akses Materi Kursus
                </a>
              )}
              {!hasRated && (
                <div style={{ padding: "15px", backgroundColor: "#f8f6f0", borderRadius: "8px" }}>
                  <h3 style={{ marginBottom: "10px" }}>Beri Rating</h3>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedStars(star)}
                        style={{
                          fontSize: "24px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: star <= selectedStars ? "#FFD700" : "#ccc"
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleRate}
                    disabled={rating || !selectedStars}
                    className="btn-primary"
                  >
                    {rating ? "Mengirim..." : "Kirim Rating"}
                  </button>
                </div>
              )}
              {hasRated && <p className="hint">Anda sudah memberi rating untuk kursus ini</p>}
              {!certId && (
                <button
                  onClick={handleIssueCertificate}
                  disabled={issuingCert}
                  className="btn-primary"
                >
                  {issuingCert ? "Membuat sertifikat..." : "Dapatkan Sertifikat"}
                </button>
              )}
              {certId && (
                <a href={`/certificate/${certId}`} className="btn-primary" style={{ textAlign: "center" }}>
                  Lihat Sertifikat
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={handleBuy}
              disabled={buying || !course.isActive}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              {buying ? "Memproses pembayaran..." : `Beli Akses - ${course.priceEth} ETH`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
