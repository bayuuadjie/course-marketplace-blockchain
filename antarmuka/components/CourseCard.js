import { RatingDisplay } from "./RatingStars";

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const FALLBACK_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23F1E9D8'/><text x='50%' y='55%' font-size='28' text-anchor='middle' fill='%235C6470'>?</text></svg>`
  );

export default function CourseCard({ course, index, isOwned, isOwner, onBuy, buying }) {
  return (
    <div className="course-row">
      <div className="course-index">No. {String(index).padStart(3, "0")}</div>

      <div className="course-info course-info-with-thumb">
        <img
          src={course.thumbnailURI || FALLBACK_THUMB}
          alt={course.title}
          className="course-thumb"
          onError={(e) => (e.target.src = FALLBACK_THUMB)}
        />
        <div>
          <span className="category-badge">{course.category}</span>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <RatingDisplay average={course.averageRating} count={course.ratingCount} />
          <div className="course-instructor">pengajar: {shortenAddress(course.instructor)}</div>
        </div>
      </div>

      <div className="course-price">
        {course.priceEth} ETH
        <small>{course.isActive ? "tersedia" : "ditutup"}</small>
      </div>

      <div>
        {isOwner ? (
          <span className="badge-owned">Kursus Anda</span>
        ) : isOwned ? (
          <span className="badge-owned">✓ Dimiliki</span>
        ) : (
          <button
            className="btn-primary"
            onClick={() => onBuy(course)}
            disabled={!course.isActive || buying}
          >
            {buying ? "Memproses..." : "Beli Akses"}
          </button>
        )}
      </div>
    </div>
  );
}
