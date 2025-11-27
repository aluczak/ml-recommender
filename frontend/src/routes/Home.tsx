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
        <button className="button button-secondary" type="button" disabled>
          Personalized picks (coming soon)
        </button>
      </div>
    </div>
  </section>
);

export default Home;
