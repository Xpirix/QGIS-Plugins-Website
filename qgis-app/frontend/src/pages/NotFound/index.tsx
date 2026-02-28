import { Link } from "react-router-dom";
import Layout from "../../components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <section className="hero is-medium">
        <div className="hero-body has-text-centered">
          <p className="title">404 – Page Not Found</p>
          <p className="subtitle">
            The page you are looking for does not exist.
          </p>
          <Link to="/" className="button is-primary">
            Go to Homepage
          </Link>
        </div>
      </section>
    </Layout>
  );
}
