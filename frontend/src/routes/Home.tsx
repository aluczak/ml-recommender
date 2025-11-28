import { Link } from "react-router-dom";
import RecommendationsSection from "../components/RecommendationsSection";

const Home = () => (
  <section className="home">
    <div className="home-hero">
      <p className="eyebrow">Welcome to the learning shop</p>
      <h1>Discover curated products backed by data.</h1>
      <p>
        Browse the sample catalog, play with the cart, and now preview the placeholder recommendations
        pipeline before ML takes over.
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

    <RecommendationsSection
      title="Popular picks"
      description="Simple rule-based suggestions derived from recent interactions."
      context="home"
      limit={4}
      interactionSource="home_recommendations"
    />
  </section>
);

export default Home;
