import { Link } from "react-router-dom";

const NotFound = () => (
  <section className="not-found">
    <h2>404</h2>
    <p>The page you requested does not exist yet.</p>
    <Link to="/" className="button">
      Back to home
    </Link>
  </section>
);

export default NotFound;
