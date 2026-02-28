/**
 * PluginSearch – a lightweight inline search widget that queries the
 * DRF API as the user types and shows a live suggestion dropdown.
 *
 * Mount with <div id="react-plugin-search"> in any Django template.
 */
import { useState, useEffect, useRef } from 'react';

const API_BASE = '/api/v1';
const DEBOUNCE_MS = 300;

export default function PluginSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setFetchError(null);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams({ search: query, page_size: 6 });
        const res = await fetch(`${API_BASE}/plugins/?${params}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch (err) {
        setFetchError(err.message);
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="dropdown is-active" style={{ width: '100%' }}>
      <div className="dropdown-trigger" style={{ width: '100%' }}>
        <div className="field has-addons" style={{ width: '100%' }}>
          <div className="control is-expanded has-icons-right">
            <input
              className="input"
              type="search"
              placeholder="Search plugins…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              aria-haspopup="listbox"
              aria-expanded={open}
            />
            {loading && (
              <span className="icon is-right">
                <i className="fas fa-spinner fa-pulse" />
              </span>
            )}
          </div>
          <div className="control">
            <a
              className="button is-primary"
              href={query ? `/plugins/?q=${encodeURIComponent(query)}` : '/plugins/'}
            >
              <span className="icon">
                <i className="fas fa-search" />
              </span>
            </a>
          </div>
        </div>
      </div>

      {fetchError && (
        <p className="help is-danger mt-1">Search unavailable: {fetchError}</p>
      )}

      {open && results.length > 0 && (
        <div
          className="dropdown-menu"
          role="listbox"
          style={{ width: '100%', display: 'block' }}
        >
          <div className="dropdown-content">
            {results.map((plugin) => (
              <a
                key={plugin.id}
                href={plugin.absolute_url}
                className="dropdown-item"
                role="option"
              >
                <div className="media">
                  {plugin.icon_url && (
                    <div className="media-left">
                      <figure className="image is-24x24">
                        <img src={plugin.icon_url} alt="" />
                      </figure>
                    </div>
                  )}
                  <div className="media-content">
                    <p className="is-size-6 has-text-weight-semibold">{plugin.name}</p>
                    <p className="is-size-7 has-text-grey">{plugin.author}</p>
                  </div>
                </div>
              </a>
            ))}
            <hr className="dropdown-divider" />
            <a
              href={`/plugins/?q=${encodeURIComponent(query)}`}
              className="dropdown-item has-text-primary"
            >
              See all results for "{query}"
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
