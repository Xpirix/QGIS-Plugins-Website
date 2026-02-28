import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { apiUploadPlugin } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function PluginUpload() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="notification is-warning">
          You must be signed in to upload a plugin.{" "}
          <a href="/accounts/login/">Sign in</a>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setUploading(true);
    setError(null);

    const { data, error: err } = await apiUploadPlugin(formData);
    setUploading(false);

    if (data) {
      setSuccess(`Plugin "${data.name}" uploaded successfully.`);
      setTimeout(() => navigate(`/plugins/${data.package_name}/`), 1500);
    } else {
      setError(err ?? "Upload failed. Please check your plugin zip file.");
    }
  };

  return (
    <Layout>
      <h1 className="title is-3">Upload Plugin</h1>
      <p className="subtitle is-6">
        Upload a plugin zip file containing a valid <code>metadata.txt</code>.
      </p>

      {error && (
        <div className="notification is-danger is-light">
          <button className="delete" onClick={() => setError(null)} />
          {error}
        </div>
      )}
      {success && (
        <div className="notification is-success is-light">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="field">
          <label className="label">Plugin ZIP file</label>
          <div className="control">
            <input
              ref={fileRef}
              className="input"
              type="file"
              name="package"
              accept=".zip"
              required
            />
          </div>
          <p className="help">
            The zip file must contain a <code>metadata.txt</code> with the plugin
            metadata.
          </p>
        </div>

        <div className="field mt-4">
          <div className="control">
            <button
              className={`button is-primary${uploading ? " is-loading" : ""}`}
              type="submit"
              disabled={uploading}
            >
              Upload
            </button>
            <button
              type="button"
              className="button is-light ml-2"
              onClick={() => navigate("/plugins/")}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
