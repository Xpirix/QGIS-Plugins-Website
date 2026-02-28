import { Link } from "react-router-dom";
import { Plugin } from "../../utils/api";

interface PluginCardProps {
  plugin: Plugin;
}

export default function PluginCard({ plugin }: PluginCardProps) {
  const pluginUrl = `/plugins/${plugin.package_name}/`;

  return (
    <div className={`card plugin-card mb-4${plugin.deprecated ? " is-deprecated" : ""}`}>
      <div className="card-content">
        <div className="media">
          {plugin.icon_url && (
            <div className="media-left">
              <figure className="image is-48x48">
                <img src={plugin.icon_url} alt={`${plugin.name} icon`} className="plugin-icon" />
              </figure>
            </div>
          )}
          <div className="media-content">
            <p className="title is-5">
              <Link to={pluginUrl} className="has-text-link">
                {plugin.name}
              </Link>
              {plugin.deprecated && (
                <span className="tag is-warning is-light ml-2">Deprecated</span>
              )}
              {plugin.featured && (
                <span className="tag is-success is-light ml-2">Featured</span>
              )}
            </p>
            <p className="subtitle is-6 has-text-grey">
              by{" "}
              <Link to={`/plugins/author/${encodeURIComponent(plugin.author)}/`}>
                {plugin.author}
              </Link>
            </p>
          </div>
        </div>

        <div className="content">
          <p className="is-size-7">{plugin.description}</p>

          <div className="level is-mobile mt-2">
            <div className="level-left is-flex-wrap-wrap">
              {plugin.latest_version && (
                <span className="tag is-info is-light mr-1">
                  v{plugin.latest_version.version}
                </span>
              )}
              {plugin.tags.slice(0, 5).map((tag) => (
                <Link
                  key={tag}
                  to={`/plugins/tags/${encodeURIComponent(tag)}/`}
                  className="tag is-light mr-1"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <div className="level-right">
              <span className="is-size-7 has-text-grey">
                ⬇ {plugin.downloads.toLocaleString()} downloads
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
