import { SAMPLE_PRODUCTS } from "../data/sampleProducts";

const Catalog = () => (
  <section className="catalog">
    <header>
      <h2>Catalog</h2>
      <p>Static sample data for now - will be replaced by the catalog API.</p>
    </header>
    <div className="grid">
      {SAMPLE_PRODUCTS.map((product) => (
        <article className="card" key={product.id}>
          <img src={product.image} alt={product.name} loading="lazy" />
          <div className="card-body">
            <p className="card-category">{product.category}</p>
            <h3>{product.name}</h3>
            <p className="card-description">{product.description}</p>
            <div className="card-footer">
              <span className="price">${product.price}</span>
              <button type="button" className="button button-ghost" disabled>
                Add to cart
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export default Catalog;
