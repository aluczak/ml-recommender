import { Link } from "react-router-dom";

const Home = () => (
  <section className="home">
    <div>
      <p className="eyebrow">Welcome to the learning shop</p>
      <h1>Discover curated products backed by data.</h1>
      <p>
        Browse the sample catalog, play with the cart, and soon experience machine-learning driven
        recommendations.
      </p>
      <div className="cta-row">
        <Link to="/catalog" className="button">
          Explore catalog
        </Link>
        <Link to="/cart" className="button button-secondary">
          View your cart
        </Link>
      </div>
    </div>
  </section>
);

export default Home;
