import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import PluginCard from "../../components/PluginCard";
import Pagination from "../../components/Pagination";
import { Plugin, apiGetPlugins } from "../../utils/api";

const PAGE_SIZE = 20;

const FILTER_LABELS: Record<string, string> = {
  "": "All Plugins",
  fresh: "New Plugins",
  latest: "Latest Updates",
  popular: "Popular",
  most_downloaded: "Most Downloaded",
  most_voted: "Most Voted",
  best_rated: "Best Rated",
  featured: "Featured",
  stable: "Stable",
  experimental: "Experimental",
  server: "Server Plugins",
  deprecated: "Deprecated",
  unapproved: "Pending Approval",
  my: "My Plugins",
};

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "downloads", label: "Downloads" },
  { value: "created_on", label: "Date Added" },
  { value: "latest_version_date", label: "Last Updated" },
];

interface Props {
  filter?: string;
  title?: string;
}

export default function PluginList({ filter = "", title }: Props) {
  // Route params (for tag, username, author filters)
  const { tags, username, author } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "name";
  const order = searchParams.get("order") || "asc";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const effectiveFilter = tags
    ? ""
    : username
    ? "user"
    : author
    ? "author"
    : filter;

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await apiGetPlugins({
      search,
      sort,
      order,
      page,
      page_size: PAGE_SIZE,
      filter: effectiveFilter || undefined,
      ...(tags ? { tag: tags } : {}),
      ...(username ? { username } : {}),
      ...(author ? { author } : {}),
    });
    if (data) {
      setPlugins(data.results);
      setCount(data.count);
    } else {
      setError(err ?? "Failed to load plugins");
    }
    setLoading(false);
  }, [search, sort, order, page, effectiveFilter, tags, username, author]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.set("q", searchInput);
      n.delete("page");
      return n;
    });
  };

  const setSort = (s: string) => {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.set("sort", s);
      n.delete("page");
      return n;
    });
  };

  const toggleOrder = () => {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.set("order", order === "asc" ? "desc" : "asc");
      n.delete("page");
      return n;
    });
  };

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      n.set("page", String(p));
      return n;
    });
    window.scrollTo(0, 0);
  };

  const pageTitle =
    title ||
    (tags ? `Plugins tagged: ${decodeURIComponent(tags)}` : null) ||
    (username ? `Plugins by ${username}` : null) ||
    (author ? `Plugins by ${decodeURIComponent(author)}` : null) ||
    FILTER_LABELS[filter] ||
    "All Plugins";

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const sidebar = (
    <>
      <p className="menu-label">Browse</p>
      <ul className="menu-list">
        {Object.entries(FILTER_LABELS)
          .filter(([k]) => !["unapproved", "my"].includes(k))
          .map(([k, label]) => (
            <li key={k}>
              <Link
                to={k ? `/plugins/${k}/` : "/plugins/"}
                className={filter === k ? "is-active" : ""}
              >
                {label}
              </Link>
            </li>
          ))}
      </ul>
      <p className="menu-label mt-4">Actions</p>
      <ul className="menu-list">
        <li><Link to="/plugins/add/">Upload Plugin</Link></li>
        <li><Link to="/plugins/my/">My Plugins</Link></li>
      </ul>
    </>
  );

  return (
    <Layout sidebar={sidebar}>
      <div className="level mb-4">
        <div className="level-left">
          <h1 className="title is-4">{pageTitle}</h1>
        </div>
        <div className="level-right is-size-7 has-text-grey">
          {!loading && `${count.toLocaleString()} plugin${count !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Search + sort */}
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
            <div className="select is-small">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="control">
            <button
              type="button"
              className="button is-small is-light"
              onClick={toggleOrder}
              title={`Sort ${order === "asc" ? "descending" : "ascending"}`}
            >
              {order === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="notification is-danger is-light">{error}</div>
      )}

      {loading ? (
        <div className="loading-container">
          <button className="button is-loading is-large is-white" />
        </div>
      ) : (
        <>
          {plugins.length === 0 ? (
            <div className="notification is-info is-light">
              No plugins found.{" "}
              {search && (
                <button
                  className="delete"
                  onClick={() => {
                    setSearchInput("");
                    setSearchParams({});
                  }}
                />
              )}
            </div>
          ) : (
            plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </Layout>
  );
}
