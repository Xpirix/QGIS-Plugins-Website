export default function Footer() {
  return (
    <footer className="footer mt-6">
      <div className="content has-text-centered">
        <p>
          <strong>QGIS Plugins Repository</strong> – part of the{" "}
          <a href="https://qgis.org" rel="noreferrer" target="_blank">
            QGIS project
          </a>
          .
        </p>
        <p className="is-size-7 has-text-grey">
          Plugins are developed by third-party developers. QGIS does not
          guarantee their quality or security.
        </p>
      </div>
    </footer>
  );
}
