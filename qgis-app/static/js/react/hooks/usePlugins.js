/**
 * Custom React hook for fetching the plugin list from the DRF API.
 * Uses the native fetch API – no external HTTP client required.
 */
import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/v1';

export function usePlugins({ search = '', tag = '', sort = 'name', order = 'asc', page = 1, pageSize = 20 } = {}) {
  const [plugins, setPlugins] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tag) params.set('tag', tag);
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    params.set('page', page);
    params.set('page_size', pageSize);

    try {
      const response = await fetch(`${API_BASE}/plugins/?${params.toString()}`);
      if (!response.ok) {
        let detail = response.statusText;
        try {
          const body = await response.json();
          if (body.detail) detail = body.detail;
        } catch (_) { /* ignore JSON parse errors */ }
        throw new Error(`HTTP ${response.status}: ${detail}`);
      }
      const data = await response.json();
      setPlugins(data.results || []);
      setCount(data.count || 0);
      setNextPage(data.next || null);
      setPrevPage(data.previous || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, tag, sort, order, page, pageSize]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  return { plugins, count, loading, error, nextPage, prevPage, refetch: fetchPlugins };
}
