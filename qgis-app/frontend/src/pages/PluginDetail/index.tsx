import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { PluginDetail, PluginVersion, apiGetPlugin, apiDeletePlugin, apiApproveVersion, apiUnapproveVersion, apiDeleteVersion } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function PluginDetailPage() {
  const { packageName } = useParams<{ packageName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<PluginDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (!packageName) return;
    setLoading(true);
    apiGetPlugin(packageName).then(({ data, error: err }) => {
      if (data) setPlugin(data);
      else setError(err ?? "Plugin not found");
      setLoading(false);
    });
  }, [packageName]);

  const handleDelete = async () => {
    if (!plugin) return;
    if (!window.confirm(`Mark "${plugin.name}" for deletion?`)) return;
    const { error: err } = await apiDeletePlugin(plugin.package_name);
    if (err) {
      setActionMsg({ type: "danger", text: err });
    } else {
      navigate("/plugins/my/");
    }
  };

  const handleApproveVersion = async (version: PluginVersion) => {
    if (!plugin) return;
    const { data, error: err } = await apiApproveVersion(plugin.package_name, version.version);
    if (data) {
      setPlugin((p) => p ? {
        ...p,
        versions: p.versions.map((v) => v.id === data.id ? data : v),
      } : p);
      setActionMsg({ type: "success", text: `Version ${data.version} approved.` });
    } else {
      setActionMsg({ type: "danger", text: err ?? "Approve failed" });
    }
  };

  const handleUnapproveVersion = async (version: PluginVersion) => {
    if (!plugin) return;
    const { data, error: err } = await apiUnapproveVersion(plugin.package_name, version.version);
    if (data) {
      setPlugin((p) => p ? {
        ...p,
        versions: p.versions.map((v) => v.id === data.id ? data : v),
      } : p);
      setActionMsg({ type: "warning", text: `Version ${data.version} unapproved.` });
    } else {
      setActionMsg({ type: "danger", text: err ?? "Unapprove failed" });
    }
  };

  const handleDeleteVersion = async (version: PluginVersion) => {
    if (!plugin) return;
    if (!window.confirm(`Delete version ${version.version}?`)) return;
    const { error: err } = await apiDeleteVersion(plugin.package_name, version.version);
    if (!err) {
      setPlugin((p) => p ? {
        ...p,
        versions: p.versions.filter((v) => v.id !== version.id),
      } : p);
      setActionMsg({ type: "success", text: `Version ${version.version} deleted.` });
    } else {
      setActionMsg({ type: "danger", text: err });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <button className="button is-loading is-large is-white" />
        </div>
      </Layout>
    );
  }

  if (error || !plugin) {
    return (
      <Layout>
        <div className="notification is-danger is-light">{error ?? "Plugin not found"}</div>
      </Layout>
    );
  }

  const canEdit = plugin.can_edit;
  const canApprove = plugin.can_approve;

  return (
    <Layout>
      {actionMsg && (
        <div className={`notification is-${actionMsg.type} is-light mb-4`}>
          <button className="delete" onClick={() => setActionMsg(null)} />
          {actionMsg.text}
        </div>
      )}

      {/* Plugin header */}
      <div className="media mb-4">
        {plugin.icon_url && (
          <div className="media-left">
            <figure className="image is-64x64">
              <img src={plugin.icon_url} alt={`${plugin.name} icon`} />
            </figure>
          </div>
        )}
        <div className="media-content">
          <h1 className="title is-3">
            {plugin.name}
            {plugin.deprecated && <span className="tag is-warning ml-2">Deprecated</span>}
            {plugin.featured && <span className="tag is-success ml-2">Featured</span>}
          </h1>
          <p className="subtitle is-6">
            by{" "}
            <Link to={`/plugins/author/${encodeURIComponent(plugin.author)}/`}>
              {plugin.author}
            </Link>
          </p>
        </div>
        {canEdit && (
          <div className="media-right">
            <Link
              to={`/plugins/${plugin.package_name}/edit/`}
              className="button is-info is-small mr-2"
            >
              Edit
            </Link>
            <button className="button is-danger is-small" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="columns">
        <div className="column is-8">
          <div className="content">
            {plugin.about && <div dangerouslySetInnerHTML={{ __html: plugin.about }} />}
            {!plugin.about && <p>{plugin.description}</p>}
          </div>

          {/* Tags */}
          {plugin.tags.length > 0 && (
            <div className="field is-grouped is-grouped-multiline mb-4">
              {plugin.tags.map((tag) => (
                <div className="control" key={tag}>
                  <Link
                    to={`/plugins/tags/${encodeURIComponent(tag)}/`}
                    className="tags has-addons"
                  >
                    <span className="tag is-link is-light">{tag}</span>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Versions table */}
          <h2 className="title is-5 mt-5">Versions</h2>
          {plugin.versions.length === 0 ? (
            <p className="has-text-grey">No approved versions available.</p>
          ) : (
            <div className="table-container">
              <table className="table is-fullwidth is-striped is-hoverable">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>QGIS min</th>
                    <th>QGIS max</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Download</th>
                    {(canApprove || canEdit) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {plugin.versions.map((ver) => (
                    <tr key={ver.id}>
                      <td>
                        <Link to={`/plugins/${plugin.package_name}/version/${ver.version}/`}>
                          {ver.version}
                        </Link>
                        {ver.experimental && (
                          <span className="tag is-warning is-light ml-1">experimental</span>
                        )}
                        {ver.supports_qt6 && (
                          <span className="tag is-info is-light ml-1">Qt6</span>
                        )}
                      </td>
                      <td>{ver.min_qg_version}</td>
                      <td>{ver.max_qg_version}</td>
                      <td>{new Date(ver.created_on).toLocaleDateString()}</td>
                      <td>
                        <span className={`tag ${ver.approved ? "is-success" : "is-warning"}`}>
                          {ver.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <a href={ver.download_url} className="button is-small is-link is-outlined">
                          ⬇ Download
                        </a>
                      </td>
                      {(canApprove || canEdit) && (
                        <td>
                          {canApprove && !ver.approved && (
                            <button
                              className="button is-small is-success mr-1"
                              onClick={() => handleApproveVersion(ver)}
                            >
                              Approve
                            </button>
                          )}
                          {canApprove && ver.approved && (
                            <button
                              className="button is-small is-warning mr-1"
                              onClick={() => handleUnapproveVersion(ver)}
                            >
                              Unapprove
                            </button>
                          )}
                          {canEdit && (
                            <button
                              className="button is-small is-danger"
                              onClick={() => handleDeleteVersion(ver)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canEdit && (
            <Link
              to={`/plugins/${plugin.package_name}/version/add/`}
              className="button is-primary mt-2"
            >
              Add New Version
            </Link>
          )}
        </div>

        {/* Sidebar info */}
        <div className="column is-4">
          <div className="box">
            <table className="table is-fullwidth is-narrow">
              <tbody>
                <tr>
                  <th>Downloads</th>
                  <td>{plugin.downloads.toLocaleString()}</td>
                </tr>
                {plugin.latest_version && (
                  <tr>
                    <th>Latest version</th>
                    <td>{plugin.latest_version.version}</td>
                  </tr>
                )}
                {plugin.repository && (
                  <tr>
                    <th>Repository</th>
                    <td>
                      <a href={plugin.repository} rel="noreferrer" target="_blank">
                        View
                      </a>
                    </td>
                  </tr>
                )}
                {plugin.tracker && (
                  <tr>
                    <th>Bug tracker</th>
                    <td>
                      <a href={plugin.tracker} rel="noreferrer" target="_blank">
                        View
                      </a>
                    </td>
                  </tr>
                )}
                {plugin.homepage && (
                  <tr>
                    <th>Homepage</th>
                    <td>
                      <a href={plugin.homepage} rel="noreferrer" target="_blank">
                        View
                      </a>
                    </td>
                  </tr>
                )}
                <tr>
                  <th>Author</th>
                  <td>
                    <Link to={`/plugins/author/${encodeURIComponent(plugin.author)}/`}>
                      {plugin.author}
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
