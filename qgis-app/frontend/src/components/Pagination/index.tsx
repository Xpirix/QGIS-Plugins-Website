interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination is-centered mt-4" role="navigation" aria-label="pagination">
      <button
        className="pagination-previous"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <button
        className="pagination-next"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
      <ul className="pagination-list">
        {page > 2 && (
          <>
            <li>
              <button className="pagination-link" onClick={() => onPageChange(1)}>1</button>
            </li>
            {page > 3 && (
              <li><span className="pagination-ellipsis">&hellip;</span></li>
            )}
          </>
        )}
        {page > 1 && (
          <li>
            <button className="pagination-link" onClick={() => onPageChange(page - 1)}>
              {page - 1}
            </button>
          </li>
        )}
        <li>
          <button className="pagination-link is-current" aria-current="page">
            {page}
          </button>
        </li>
        {page < totalPages && (
          <li>
            <button className="pagination-link" onClick={() => onPageChange(page + 1)}>
              {page + 1}
            </button>
          </li>
        )}
        {page < totalPages - 1 && (
          <>
            {page < totalPages - 2 && (
              <li><span className="pagination-ellipsis">&hellip;</span></li>
            )}
            <li>
              <button className="pagination-link" onClick={() => onPageChange(totalPages)}>
                {totalPages}
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
