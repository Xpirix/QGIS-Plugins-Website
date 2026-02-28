/**
 * React application entry point.
 * Mounts React components into Django-rendered pages
 * when the corresponding DOM containers are present.
 */
import { createRoot } from 'react-dom/client';
import PluginList from './components/PluginList';
import PluginSearch from './components/PluginSearch';

document.addEventListener('DOMContentLoaded', () => {
  // Mount the plugin list widget when its container exists
  const pluginListEl = document.getElementById('react-plugin-list');
  if (pluginListEl) {
    const root = createRoot(pluginListEl);
    root.render(<PluginList />);
  }

  // Mount the search widget when its container exists
  const pluginSearchEl = document.getElementById('react-plugin-search');
  if (pluginSearchEl) {
    const root = createRoot(pluginSearchEl);
    root.render(<PluginSearch />);
  }
});
