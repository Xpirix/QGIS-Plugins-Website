import Layout from "../../components/Layout";

const DOCS = [
  {
    slug: "publish",
    title: "Publishing Plugins",
    content: `
      <h2>How to publish a QGIS plugin</h2>
      <p>To publish a plugin in the QGIS Plugins Repository:</p>
      <ol>
        <li>Create your plugin following the <a href="https://docs.qgis.org/latest/en/docs/pyqgis_developer_cookbook/" target="_blank">PyQGIS Developer Cookbook</a>.</li>
        <li>Add a valid <code>metadata.txt</code> file to your plugin directory.</li>
        <li>Zip the plugin directory.</li>
        <li>Sign in to this repository and click <strong>Upload Plugin</strong>.</li>
      </ol>
      <h3>Required metadata fields</h3>
      <ul>
        <li><code>name</code> – The plugin name (must be unique)</li>
        <li><code>description</code> – Short description</li>
        <li><code>version</code> – Plugin version (e.g. 1.0.0)</li>
        <li><code>qgisMinimumVersion</code> – Minimum QGIS version required</li>
        <li><code>author</code> – Author name</li>
        <li><code>email</code> – Author email</li>
      </ul>
    `,
  },
  {
    slug: "approval",
    title: "Approval Process",
    content: `
      <h2>Plugin Approval Process</h2>
      <p>All plugins go through a review process before being made publicly available.</p>
      <h3>Initial submission</h3>
      <p>When you upload a plugin for the first time, it will be reviewed by the QGIS team. The review checks for:</p>
      <ul>
        <li>Valid metadata</li>
        <li>No obvious security issues</li>
        <li>Working basic functionality</li>
      </ul>
      <h3>Trusted authors</h3>
      <p>Once an author is trusted, their plugins are automatically approved on upload.</p>
    `,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    content: `
      <h2>FAQ</h2>
      <dl>
        <dt><strong>How long does review take?</strong></dt>
        <dd>Usually a few days. You'll be notified by email.</dd>
        <dt><strong>Can I update a plugin without review?</strong></dt>
        <dd>Trusted authors can upload new versions that are automatically approved.</dd>
        <dt><strong>How do I become a trusted author?</strong></dt>
        <dd>After your first plugin is approved and deemed high quality, a staff member can grant you trusted status.</dd>
      </dl>
    `,
  },
];

interface Props {
  slug?: string;
}

export default function Docs({ slug }: Props) {
  const doc = DOCS.find((d) => d.slug === slug) ?? DOCS[0];

  const sidebar = (
    <>
      <p className="menu-label">Documentation</p>
      <ul className="menu-list">
        {DOCS.map((d) => (
          <li key={d.slug}>
            <a href={`/docs/${d.slug}/`} className={d.slug === slug ? "is-active" : ""}>
              {d.title}
            </a>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <Layout sidebar={sidebar}>
      <div
        className="content"
        dangerouslySetInnerHTML={{ __html: doc.content }}
      />
    </Layout>
  );
}
