export const CATEGORIES = [
  "Semua",
  "Programming",
  "Desain",
  "Bisnis",
  "Bahasa",
  "Marketing",
  "Lainnya"
];

export default function SearchFilterBar({ search, onSearchChange, category, onCategoryChange, sortBy, onSortChange }) {
  return (
    <div className="filter-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Cari judul kursus..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
        <option value="newest">Terbaru</option>
        <option value="price-asc">Harga: Rendah ke Tinggi</option>
        <option value="price-desc">Harga: Tinggi ke Rendah</option>
        <option value="rating">Rating Tertinggi</option>
      </select>
    </div>
  );
}
