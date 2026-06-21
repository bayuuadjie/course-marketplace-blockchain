export function RatingDisplay({ average, count }) {
  const rounded = Math.round(average);
  return (
    <span className="rating-display">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "star filled" : "star"}>
          ★
        </span>
      ))}
      <span className="rating-count">
        {count > 0 ? `${average.toFixed(1)} (${count})` : "Belum ada rating"}
      </span>
    </span>
  );
}

export function RatingInput({ value, onChange }) {
  return (
    <span className="rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className={star <= value ? "star filled" : "star"}
          onClick={() => onChange(star)}
          aria-label={`Beri ${star} bintang`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
