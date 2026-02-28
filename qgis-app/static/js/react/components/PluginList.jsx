/**
 * PluginList – renders a paginated, searchable list of approved plugins
 * fetched from the DRF REST API (/api/v1/plugins/).
 *
 * Mount this component by placing a <div id="react-plugin-list"> in a
 * Django template and including the "app" webpack bundle.
 */
import { useState, useCallback } from 'react';
import { usePlugins } from '../hooks/usePlugins';
import PluginCard from './PluginCard';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'created_on', label: 'Date Added' },
  { value: 'latest_version_date', label: 'Last Updated' },
];

export default function PluginList() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { plugins, count, loading, error, nextPage, prevPage } = usePlugins({
    search,
    sort,
    order,
    page,
    pageSize,
  });

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput]
  );

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  const handleOrderToggle = () => {
    setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="plugin-list-react">
      {/* Search + sort bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="search"
              placeholder="Search plugins…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="control">
            <button className="button is-primary" type="submit">
              Search
            </button>
          </div>
        </div>
        <div className="field is-grouped mt-2">
          <div className="control">
            <div className="select">
              <select value={sort} onChange={handleSortChange}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="control">
            <button
              type="button"
              className="button is-light"
              onClick={handleOrderToggle}
              title={`Sort ${order === 'asc' ? 'descending' : 'ascending'}`}
            >
              <span className="icon">
                <i className={`fas fa-sort-amount-${order === 'asc' ? 'up' : 'down'}`} />
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Result count */}
      {!loading && (
        <p className="is-size-7 has-text-grey mb-3">
          {count.toLocaleString()} plugin{count !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="notification is-danger is-light">
          Failed to load plugins: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="has-text-centered py-6">
          <span className="icon is-large has-text-grey-light">
            <i className="fas fa-spinner fa-pulse fa-2x" />
          </span>
        </div>
      )}

      {/* Plugin cards */}
      {!loading &&
        plugins.map((plugin) => (
          <PluginCard key={plugin.id} plugin={plugin} />
        ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="pagination is-centered mt-4"
          role="navigation"
          aria-label="pagination"
        >
          <button
            className="pagination-previous"
            disabled={!prevPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="pagination-next"
            disabled={!nextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
          <ul className="pagination-list">
            <li>
              <span className="pagination-ellipsis">
                Page {page} of {totalPages}
              </span>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
