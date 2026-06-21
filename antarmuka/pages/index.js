import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchAllCourses, buyCourse, hasPurchasedCourse } from "konektor";
import { useWallet } from "../hooks/useWalletContext";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";

export default function Home() {
  const { account, connect } = useWallet();
  const [courses, setCourses] = useState([]);
  const [ownedMap, setOwnedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("newest");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const list = await fetchAllCourses();
      setCourses(list);

      if (account) {
        const ownedEntries = await Promise.all(
          list.map(async (c) => [c.id, await hasPurchasedCourse(c.id, account)])
        );
        setOwnedMap(Object.fromEntries(ownedEntries));
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Gagal mengambil daftar kursus." });
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  async function handleBuy(course) {
    setMessage(null);

    if (!account) {
      await connect();
      return;
    }

    setBuyingId(course.id);
    try {
      await buyCourse(course.id, course.priceWei);
      setMessage({ type: "success", text: `Berhasil membeli "${course.title}"!` });
      await loadCourses();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.shortMessage || err.message || "Transaksi gagal." });
    } finally {
      setBuyingId(null);
    }
  }

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }

    if (category !== "Semua") {
      result = result.filter((c) => c.category === category);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => Number(a.priceEth) - Number(b.priceEth));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => Number(b.priceEth) - Number(a.priceEth));
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.averageRating - a.averageRating);
    } else {
      result.sort((a, b) => Number(b.id) - Number(a.id)); // newest first
    }

    return result;
  }, [courses, search, category, sortBy]);

  return (
    <main className="container">
      <section className="hero">
        <div className="hero-eyebrow">marketplace kursus berbasis blockchain</div>
        <h1>Belajar apa pun, bayar langsung ke pengajarnya — tanpa perantara.</h1>
        <p>
          Setiap kursus tercatat sebagai entri permanen di blockchain. Bayar dengan ETH simulasi
          lewat MetaMask, dapatkan e-sertifikat yang juga terverifikasi on-chain.
        </p>
      </section>

      <section className="ledger">
        {message && (
          <p className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </p>
        )}

        {!loading && courses.length > 0 && (
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {!loading && filteredCourses.length > 0 && (
          <div className="ledger-header">
            <span>No.</span>
            <span>Kursus</span>
            <span>Harga</span>
            <span>Aksi</span>
          </div>
        )}

        {loading ? (
          <p className="hint">Memuat data dari blockchain...</p>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <h3>Belum ada kursus tercatat</h3>
            <p>Jadilah pengajar pertama — buat kursus dari menu &quot;Buat Kursus&quot;.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <h3>Tidak ada kursus yang cocok</h3>
            <p>Coba ubah kata kunci pencarian atau filter kategori.</p>
          </div>
        ) : (
          filteredCourses.map((course, idx) => (
            <CourseCard
              key={course.id}
              index={idx + 1}
              course={course}
              isOwned={ownedMap[course.id]}
              isOwner={account && course.instructor.toLowerCase() === account.toLowerCase()}
              buying={buyingId === course.id}
              onBuy={handleBuy}
            />
          ))
        )}
      </section>
    </main>
  );
}
