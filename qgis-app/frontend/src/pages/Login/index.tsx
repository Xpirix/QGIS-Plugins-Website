import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in → redirect
  if (isAuthenticated) {
    navigate("/plugins/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await login(username, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate("/plugins/");
    }
  };

  return (
    <Layout>
      <div className="columns is-centered">
        <div className="column is-5">
          <div className="box">
            <h1 className="title is-4 has-text-centered">Sign in</h1>

            {error && (
              <div className="notification is-danger is-light">
                <button className="delete" onClick={() => setError(null)} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="label">Username</label>
                <div className="control has-icons-left">
                  <input
                    className="input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    autoComplete="username"
                    required
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <span className="icon is-left">👤</span>
                </div>
              </div>

              <div className="field">
                <label className="label">Password</label>
                <div className="control has-icons-left">
                  <input
                    className="input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    autoComplete="current-password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="icon is-left">🔒</span>
                </div>
              </div>

              <div className="field mt-4">
                <div className="control">
                  <button
                    className={`button is-primary is-fullwidth${loading ? " is-loading" : ""}`}
                    type="submit"
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
