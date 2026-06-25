import type { Product } from '../services/api'

type ProductCardProps = {
  product: Product
  view?: 'grid' | 'list'
  onAddToCart: (product: Product) => void
}

export default function ProductCard({ product, view = 'grid', onAddToCart }: ProductCardProps) {
  const hoverImage = product.gallery.find((image) => image !== product.image) ?? product.image

  return (
    <article className="products-entry clearfix product-wapper dynamic-card">
      <div className="products-thumb">
        <div className="product-lable">
          {product.featured && <div className="hot">Hot</div>}
          {product.salePrice && <div className="onsale">Sale</div>}
        </div>
        <div className="product-thumb-hover">
          <a href={`/product/${product.slug}`}>
            <img alt={product.name} className="post-image" src={product.image} />
            <img alt={product.name} className="hover-image back" src={hoverImage} />
          </a>
        </div>
        <div className="product-button">
          <div className="btn-add-to-cart" data-title={product.status === 'out-of-stock' ? 'Out of stock' : 'Add to cart'}>
            <button
              className="product-btn button"
              disabled={product.status === 'out-of-stock'}
              type="button"
              onClick={() => onAddToCart(product)}
            >
              {product.status === 'out-of-stock' ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
          <div className="btn-wishlist" data-title="Wishlist">
            <button className="product-btn" type="button">Add to wishlist</button>
          </div>
          <div className="btn-compare" data-title="Compare">
            <button className="product-btn" type="button">Compare</button>
          </div>
        </div>
      </div>
      <div className="products-content">
        <div className={view === 'grid' ? 'contents text-center' : 'contents'}>
          <div className="rating">
            <div className="star star-5"></div>
            <span className="count">({product.reviews.length} review)</span>
          </div>
          <h3 className="product-title">
            <a href={`/product/${product.slug}`}>{product.name}</a>
          </h3>
          <div className="dynamic-meta">{product.category}</div>
          <span className="price">
            {product.salePrice && <del>${product.price}</del>} <ins>${product.salePrice ?? product.price}</ins>
          </span>
          {view === 'list' && <p className="shop-list-description" dangerouslySetInnerHTML={{ __html: product.description }} />}
        </div>
      </div>
    </article>
  )
}
