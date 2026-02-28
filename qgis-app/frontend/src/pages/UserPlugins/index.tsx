import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../../components/Layout";
import PluginCard from "../../components/PluginCard";
import Pagination from "../../components/Pagination";
import { Plugin, UserProfile, apiGetPlugins, apiGetUser, apiTrustUser, apiUntrustUser, apiBlockUser, apiUnblockUser } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const PAGE_SIZE = 20;

export default function UserPlugins() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const isMyPlugins = !username;
  const effectiveUsername = username ?? currentUser?.username;

  useEffect(() => {
    if (!effectiveUsername) return;
    setLoading(true);
    Promise.all([
      apiGetPlugins({
        username: effectiveUsername,
        page,
        page_size: PAGE_SIZE,
        filter: isMyPlugins ? "my" : undefined,
      }),
      apiGetUser(effectiveUsername),
    ]).then(([pluginsRes, userRes]) => {
      setPlugins(pluginsRes.data?.results ?? []);
      setCount(pluginsRes.data?.count ?? 0);
      setProfile(userRes.data ?? null);
      if (pluginsRes.error) setError(pluginsRes.error);
      setLoading(false);
    });
  }, [effectiveUsername, page, isMyPlugins]);

  const handleAction = async (action: "trust" | "untrust" | "block" | "unblock") => {
    if (!effectiveUsername) return;
    const fn = { trust: apiTrustUser, untrust: apiUntrustUser, block: apiBlockUser, unblock: apiUnblockUser }[action];
    const { data, error: err } = await fn(effectiveUsername);
    if (data) {
      setProfile(data);
      const actionLabels: Record<string, string> = {
        trust: "trusted",
        untrust: "untrusted",
        block: "blocked",
        unblock: "unblocked",
      };
      setActionMsg(`User has been ${actionLabels[action]}.`);
    } else {
      setActionMsg(err ?? "Action failed");
    }
  };

  const canManageUser = currentUser?.is_staff && !isMyPlugins;

  return (
    <Layout>
      {actionMsg && (
        <div className="notification is-info is-light mb-4">
          <button className="delete" onClick={() => setActionMsg(null)} />
          {actionMsg}
        </div>
      )}

      <div className="level mb-4">
        <div className="level-left">
          <h1 className="title is-4">
            {isMyPlugins ? "My Plugins" : `Plugins by ${effectiveUsername}`}
          </h1>
        </div>
        {isMyPlugins && (
          <div className="level-right">
            <Link to="/plugins/add/" className="button is-primary is-small">
              Upload Plugin
            </Link>
          </div>
        )}
      </div>

      {/* User profile (for staff) */}
      {profile && canManageUser && (
        <div className="box mb-4">
          <div className="level">
            <div className="level-left">
              <p>
                <strong>{profile.username}</strong> —{" "}
                {profile.is_trusted ? "Trusted" : "Not trusted"} —{" "}
                {profile.is_staff ? "Staff" : "Regular user"}
              </p>
            </div>
            <div className="level-right">
              {!profile.is_trusted ? (
                <button className="button is-success is-small mr-1" onClick={() => handleAction("trust")}>Trust</button>
              ) : (
                <button className="button is-warning is-small mr-1" onClick={() => handleAction("untrust")}>Untrust</button>
              )}
              {profile.is_staff ? null : (
                <>
                  <button className="button is-danger is-small" onClick={() => handleAction("block")}>Block</button>
                  <button className="button is-info is-small ml-1" onClick={() => handleAction("unblock")}>Unblock</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="notification is-danger is-light">{error}</div>
      )}

      {loading ? (
        <div className="loading-container">
          <button className="button is-loading is-large is-white" />
        </div>
      ) : plugins.length === 0 ? (
        <div className="notification is-info is-light">
          No plugins found.{" "}
          {isMyPlugins && <Link to="/plugins/add/">Upload your first plugin</Link>}
        </div>
      ) : (
        <>
          {plugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
          <Pagination
            page={page}
            totalPages={Math.ceil(count / PAGE_SIZE)}
            onPageChange={setPage}
          />
        </>
      )}
    </Layout>
  );
}
