import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PluginList from "./pages/PluginList";
import PluginDetail from "./pages/PluginDetail";
import PluginUpload from "./pages/PluginUpload";
import Login from "./pages/Login";
import UserPlugins from "./pages/UserPlugins";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* Plugin management */}
      <Route path="/plugins/add/" element={<PluginUpload />} />
      <Route path="/plugins/my/" element={<UserPlugins />} />

      {/* Filtered plugin lists */}
      <Route path="/plugins/" element={<PluginList />} />
      <Route path="/plugins/fresh/" element={<PluginList filter="fresh" title="New Plugins" />} />
      <Route path="/plugins/latest/" element={<PluginList filter="latest" title="Latest Updates" />} />
      <Route path="/plugins/popular/" element={<PluginList filter="popular" title="Popular Plugins" />} />
      <Route path="/plugins/most_downloaded/" element={<PluginList filter="most_downloaded" title="Most Downloaded" />} />
      <Route path="/plugins/most_voted/" element={<PluginList filter="most_voted" title="Most Voted" />} />
      <Route path="/plugins/best_rated/" element={<PluginList filter="best_rated" title="Best Rated" />} />
      <Route path="/plugins/featured/" element={<PluginList filter="featured" title="Featured Plugins" />} />
      <Route path="/plugins/stable/" element={<PluginList filter="stable" title="Stable Plugins" />} />
      <Route path="/plugins/experimental/" element={<PluginList filter="experimental" title="Experimental Plugins" />} />
      <Route path="/plugins/server/" element={<PluginList filter="server" title="Server Plugins" />} />
      <Route path="/plugins/deprecated/" element={<PluginList filter="deprecated" title="Deprecated Plugins" />} />
      <Route path="/plugins/unapproved/" element={<PluginList filter="unapproved" title="Pending Approval" />} />
      <Route path="/plugins/feedback_pending/" element={<PluginList filter="feedback_pending" title="Feedback Pending" />} />
      <Route path="/plugins/feedback_received/" element={<PluginList filter="feedback_received" title="Feedback Received" />} />
      <Route path="/plugins/feedback_completed/" element={<PluginList filter="feedback_completed" title="Feedback Resolved" />} />

      {/* Filtered by tag / user / author */}
      <Route path="/plugins/tags/:tags/" element={<PluginList />} />
      <Route path="/plugins/user/:username/" element={<UserPlugins />} />
      <Route path="/plugins/author/:author/" element={<PluginList />} />

      {/* Plugin detail */}
      <Route path="/plugins/:packageName/" element={<PluginDetail />} />

      {/* Auth */}
      <Route path="/accounts/login/" element={<Login />} />

      {/* Docs */}
      <Route path="/docs/publish/" element={<Docs slug="publish" />} />
      <Route path="/docs/approval/" element={<Docs slug="approval" />} />
      <Route path="/docs/faq/" element={<Docs slug="faq" />} />

      {/* Search (redirect to PluginList with query) */}
      <Route path="/search/" element={<PluginList />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
