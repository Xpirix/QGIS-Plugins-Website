/**
 * PluginCard – a Bulma-styled card that displays a single plugin summary.
 */
import { memo } from 'react';

function PluginCard({ plugin }) {
  const {
    package_name,
    name,
    description,
    author,
    icon_url,
    latest_version,
    downloads,
    deprecated,
    absolute_url,
    tags,
  } = plugin;

  return (
    <div className={`card mb-4${deprecated ? ' has-background-warning-light' : ''}`}>
      <div className="card-content">
        <div className="media">
          {icon_url && (
            <div className="media-left">
              <figure className="image is-48x48">
                <img src={icon_url} alt={`${name} icon`} />
              </figure>
            </div>
          )}
          <div className="media-content">
            <p className="title is-5">
              <a href={absolute_url} className="has-text-link">
                {name}
              </a>
              {deprecated && (
                <span className="tag is-warning is-light ml-2">Deprecated</span>
              )}
            </p>
            <p className="subtitle is-6 has-text-grey">by {author}</p>
          </div>
        </div>

        <div className="content">
          <p className="is-size-7">{description}</p>
          <div className="level is-mobile mt-2">
            <div className="level-left">
              {latest_version && (
                <span className="tag is-info is-light mr-1">
                  v{latest_version.version}
                </span>
              )}
              {tags &&
                tags.slice(0, 5).map((tag) => (
                  <a
                    key={tag}
                    href={`/plugins/tags/${encodeURIComponent(tag)}/`}
                    className="tag is-light mr-1"
                  >
                    {tag}
                  </a>
                ))}
            </div>
            <div className="level-right">
              <span className="is-size-7 has-text-grey">
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-download" />
                  </span>
                  <span>{downloads.toLocaleString()}</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PluginCard);
