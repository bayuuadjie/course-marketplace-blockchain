import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchAllCourses,
  hasPurchasedCourse,
  hasRatedCourse,
  rateCourse,
  issueCertificate,
  getCertificateId,
  getInstructorEarnings,
  withdrawEarnings
} from "konektor";
import { useWallet } from "../hooks/useWalletContext";
import { RatingInput } from "../components/RatingStars";

export default function MyCourses() {
  const { account, connect } = useWallet();
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [taughtCourses, setTaughtCourses] = useState([]);
  const [ratedMap, setRatedMap] = useState({});
  const [certMap, setCertMap] = useState({}); // courseId -> certId ("0" jika belum ada)
  const [earnings, setEarnings] = useState("0");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // courseId yang sedang diproses (rate/sertifikat)
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = useCallback(async () => {
    if (!account) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const all = await fetchAllCourses();

      const owned = [];
      const rated = {};
      const certs = {};
      for (const c of all) {
        const owns = await hasPurchasedCourse(c.id, account);
        if (owns) {
          owned.push(c);
          rated[c.id] = await hasRatedCourse(c.id, account);
          certs[c.id] = await getCertificateId(c.id, account);
        }
      }
      setPurchasedCourses(owned);
      setRatedMap(rated);
      setCertMap(certs);

      const taught = all.filter((c) => c.instructor.toLowerCase() === account.toLowerCase());
      setTaughtCourses(taught);

      const earningsEth = await getInstructorEarnings(account);
      setEarnings(earningsEth);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Gagal memuat data." });
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRate(courseId, stars) {
    setMessage(null);
    setBusyId(courseId);
    try {
      await rateCourse(courseId, stars);
      setMessage({ type: "success", text: "Terima kasih atas rating Anda!" });
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message || "Gagal mengirim rating." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleIssueCertificate(courseId) {
    setMessage(null);
    setBusyId(courseId);
    try {
      await issueCertificate(courseId);
      setMessage({ type: "success", text: "E-sertifikat berhasil diterbitkan di blockchain!" });
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message || "Gagal menerbitkan sertifikat." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleWithdraw() {
    setMessage(null);
    setWithdrawing(true);
    try {
      await withdrawEarnings();
      setMessage({ type: "success", text: "Dana berhasil ditarik ke wallet Anda." });
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message || "Penarikan gagal." });
    } finally {
      setWithdrawing(false);
    }
  }

  if (!account) {
    return (
      <main className="container form-page">
        <h1>Kursus Saya</h1>
        <p className="sub">Hubungkan MetaMask untuk melihat kursus yang Anda miliki dan ajarkan.</p>
        <button className="btn-primary" onClick={connect}>
          Hubungkan MetaMask
        </button>
      </main>
    );
  }

  return (
    <main className="container form-page" style={{ maxWidth: 780 }}>
      <h1>Kursus Saya</h1>
      <p className="sub">Kursus yang Anda beli, rating, e-sertifikat, dan kursus yang Anda ajarkan.</p>

      {message && (
        <p className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="hint">Memuat data...</p>
      ) : (
        <>
          <h3 style={{ fontFamily: "var(--font-display)" }}>Kursus yang Anda Beli</h3>
          {purchasedCourses.length === 0 ? (
            <p className="hint">Anda belum membeli kursus apa pun.</p>
          ) : (
            purchasedCourses.map((c) => {
              const certId = certMap[c.id];
              const sudahPunyaSertifikat = certId && certId !== "0";
              return (
                <div className="owned-course-card" key={c.id}>
                  <div className="course-info">
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>

                  <div className="owned-course-actions">
                    <a className="btn-primary" href={c.contentURI} target="_blank" rel="noreferrer">
                      Buka Materi
                    </a>

                    {!ratedMap[c.id] && (
                      <div className="rate-row">
                        <span className="hint">Beri rating:</span>
                        <RatingInput value={0} onChange={(stars) => handleRate(c.id, stars)} />
                      </div>
                    )}

                    {sudahPunyaSertifikat ? (
                      <Link href={`/certificate/${certId}`} className="btn-primary btn-outline">
                        Lihat E-Sertifikat
                      </Link>
                    ) : (
                      <button
                        className="btn-primary btn-outline"
                        onClick={() => handleIssueCertificate(c.id)}
                        disabled={busyId === c.id}
                      >
                        {busyId === c.id ? "Memproses..." : "Terbitkan E-Sertifikat"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 40 }}>
            Kursus yang Anda Terbitkan
          </h3>
          {taughtCourses.length === 0 ? (
            <p className="hint">Anda belum menerbitkan kursus apa pun.</p>
          ) : (
            taughtCourses.map((c) => (
              <div className="course-row" key={c.id} style={{ gridTemplateColumns: "1fr 140px" }}>
                <div className="course-info">
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
                <div className="course-price">
                  {c.priceEth} ETH
                  <small>{c.isActive ? "tersedia" : "ditutup"}</small>
                </div>
              </div>
            ))
          )}

          <div className="earnings-card">
            <div>
              <div className="label">Saldo belum ditarik</div>
              <div className="amount">{earnings} ETH</div>
            </div>
            <button
              className="btn-primary"
              onClick={handleWithdraw}
              disabled={withdrawing || Number(earnings) <= 0}
            >
              {withdrawing ? "Memproses..." : "Tarik Dana"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
