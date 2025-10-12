import "./Pagination.css";

export default function Pagination({ page, pageSize, total, onChange }) {
  if (total <= pageSize) return null;
  const pages = Math.ceil(total / pageSize);

  const goTo = (next) => {
    if (next < 1 || next > pages || next === page) return;
    onChange(next);
  };

  return (
    <div className="pagination">
      <button onClick={() => goTo(page - 1)} disabled={page <= 1}>
        Prev
      </button>
      {Array.from({ length: pages }, (_, idx) => idx + 1).map((p) => (
        <button
          key={p}
          onClick={() => goTo(p)}
          className={p === page ? "active" : ""}
          disabled={p === page}
        >
          {p}
        </button>
      ))}
      <button onClick={() => goTo(page + 1)} disabled={page >= pages}>
        Next
      </button>
    </div>
  );
}
