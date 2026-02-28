import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import PluginCard from "../../components/PluginCard";
import { Plugin, apiGetPlugins } from "../../utils/api";

export default function Home() {
  const [featured, setFeatured] = useState<Plugin[]>([]);
  const [fresh, setFresh] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGetPlugins({ filter: "featured", page_size: 6 }),
      apiGetPlugins({ filter: "fresh", page_size: 6 }),
    ]).then(([featuredRes, freshRes]) => {
      setFeatured(featuredRes.data?.results ?? []);
      setFresh(freshRes.data?.results ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="hero is-primary is-medium mb-6">
        <div className="hero-body">
          <p className="title">QGIS Plugins Repository</p>
          <p className="subtitle">
            Discover and share plugins for QGIS, the open-source Geographic
            Information System.
          </p>
          <div className="field has-addons">
            <div className="control is-expanded">
              <input
                className="input is-medium"
                type="search"
                placeholder="Search plugins…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = (e.target as HTMLInputElement).value.trim();
                    if (q) window.location.href = `/search/?q=${encodeURIComponent(q)}`;
                  }
                }}
              />
            </div>
            <div className="control">
              <Link to="/plugins/" className="button is-medium is-light">
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-container">
          <button className="button is-loading is-large is-white" />
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mb-6">
              <div className="level">
                <div className="level-left">
                  <h2 className="title is-4">⭐ Featured Plugins</h2>
                </div>
                <div className="level-right">
                  <Link to="/plugins/featured/" className="button is-small is-link is-outlined">
                    View all
                  </Link>
                </div>
              </div>
              <div className="columns is-multiline">
                {featured.map((plugin) => (
                  <div className="column is-6" key={plugin.id}>
                    <PluginCard plugin={plugin} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {fresh.length > 0 && (
            <section>
              <div className="level">
                <div className="level-left">
                  <h2 className="title is-4">🆕 New Plugins</h2>
                </div>
                <div className="level-right">
                  <Link to="/plugins/fresh/" className="button is-small is-link is-outlined">
                    View all
                  </Link>
                </div>
              </div>
              <div className="columns is-multiline">
                {fresh.map((plugin) => (
                  <div className="column is-6" key={plugin.id}>
                    <PluginCard plugin={plugin} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Layout>
  );
}
