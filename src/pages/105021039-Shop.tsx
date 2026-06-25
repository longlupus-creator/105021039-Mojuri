import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, Product } from '../services/api'
import ProductCard from '../components/105021039-ProductCard'
import { useCartStore } from '../stores/cartStore'

type SortMode = 'default' | 'latest' | 'price-asc' | 'price-desc'

export default function Shop() {
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState<SortMode>('default')
  const addItem = useCartStore((state) => state.addItem)

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  })

  const { data: productsResponse, error, isLoading } = useQuery({
    queryKey: ['products', { page, category, search, maxPrice }],
    queryFn: () => api.getProducts({ page, limit: 6, category, search, maxPrice }),
  })

  const { data: featuredResponse } = useQuery({
    queryKey: ['products', 'shop-featured'],
    queryFn: () => api.getProducts({ featured: true, limit: 3 }),
  })

  useEffect(() => {
    setPage(1)
  }, [category, search, maxPrice])

  const products = sortProducts(productsResponse?.data ?? [], sort)
  const featuredProducts = featuredResponse?.data ?? []
  const categories = categoriesResponse?.data.products ?? []
  const total = productsResponse?.meta.total ?? products.length
  const totalPages = productsResponse?.meta.totalPages ?? 1

  return (
    <main className="site-main" id="site-main">
      <div className="main-content" id="main-content">
        <div className="content-area" id="primary">
          <div className="page-title" id="title">
            <div className="section-container">
              <div className="content-title-heading">
                <h1 className="text-title-heading">Shop</h1>
              </div>
              <div className="breadcrumbs">
                <a href="/">Home</a>
                <span className="delimiter"></span>Shop
              </div>
            </div>
          </div>

          <div className="site-content" id="content" role="main">
            <div className="section-padding">
              <div className="section-container p-l-r">
                <div className="row">
                  <aside className="col-xl-3 col-lg-3 col-md-12 col-12 sidebar left-sidebar md-b-50 p-t-10">
                    <div className="block block-product-cats">
                      <div className="block-title"><h2>Categories</h2></div>
                      <div className="block-content">
                        <div className="product-cats-list">
                          <ul>
                            <li className={!category ? 'current' : ''}>
                              <button type="button" onClick={() => setCategory('')}>
                                All <span className="count">{total}</span>
                              </button>
                            </li>
                            {categories.map((item) => (
                              <li className={category === item ? 'current' : ''} key={item}>
                                <button type="button" onClick={() => setCategory(item)}>
                                  {item}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="block block-product-filter">
                      <div className="block-title"><h2>Search</h2></div>
                      <div className="block-content">
                        <input
                          className="shop-old-input"
                          placeholder="Search jewelry"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="block block-product-filter">
                      <div className="block-title"><h2>Price</h2></div>
                      <div className="block-content">
                        <input
                          className="shop-old-input"
                          min="0"
                          placeholder="Max price"
                          type="number"
                          value={maxPrice}
                          onChange={(event) => setMaxPrice(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="block block-products">
                      <div className="block-title"><h2>Feature Product</h2></div>
                      <div className="block-content">
                        <ul className="products-list">
                          {featuredProducts.map((product) => (
                            <li className="product-item" key={product.id}>
                              <a className="product-image" href={`/product/${product.slug}`}>
                                <img alt={product.name} src={product.image} />
                              </a>
                              <div className="product-content">
                                <h2 className="product-title">
                                  <a href={`/product/${product.slug}`}>{product.name}</a>
                                </h2>
                                <div className="rating"><div className="star star-5"></div></div>
                                <span className="price">
                                  {product.salePrice ? (
                                    <>
                                      <del><span>${product.price}</span></del>
                                      <ins><span>${product.salePrice}</span></ins>
                                    </>
                                  ) : (
                                    `$${product.price}`
                                  )}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </aside>

                  <div className="col-xl-9 col-lg-9 col-md-12 col-12">
                    <div className="products-topbar clearfix">
                      <div className="products-topbar-left">
                        <div className="products-count">
                          {isLoading ? 'Loading products...' : `Showing ${products.length} of ${total} results`}
                        </div>
                      </div>
                      <div className="products-topbar-right">
                        <div className="products-sort shop-old-sort">
                          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                            <option value="default">Default sorting</option>
                            <option value="latest">Sort by latest</option>
                            <option value="price-asc">Sort by price: low to high</option>
                            <option value="price-desc">Sort by price: high to low</option>
                          </select>
                        </div>
                        <ul className="layout-toggle nav nav-tabs">
                          <li className="nav-item">
                            <button
                              className={`layout-grid nav-link ${view === 'grid' ? 'active' : ''}`}
                              type="button"
                              onClick={() => setView('grid')}
                            >
                              <span className="icon-column"><span className="layer first"><span></span><span></span><span></span></span><span className="layer middle"><span></span><span></span><span></span></span><span className="layer last"><span></span><span></span><span></span></span></span>
                            </button>
                          </li>
                          <li className="nav-item">
                            <button
                              className={`layout-list nav-link ${view === 'list' ? 'active' : ''}`}
                              type="button"
                              onClick={() => setView('list')}
                            >
                              <span className="icon-column"><span className="layer first"><span></span><span></span></span><span className="layer middle"><span></span><span></span></span><span className="layer last"><span></span><span></span></span></span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {error && <p className="auth-message">{error instanceof Error ? error.message : 'Cannot load products'}</p>}

                    <div className="tab-content">
                      <div className="tab-pane fade show active" role="tabpanel">
                        <div className={`products-list ${view}`}>
                          <div className="row">
                            {!isLoading && products.length === 0 && (
                              <div className="col-12">
                                <p>No products found.</p>
                              </div>
                            )}
                            {products.map((product) => (
                              <div className={view === 'grid' ? 'col-xl-4 col-lg-4 col-md-4 col-sm-6' : 'col-12'} key={product.id}>
                                <ProductCard product={product} view={view} onAddToCart={addItem} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <nav className="pagination dynamic-pagination">
                      <button disabled={page === 1} type="button" onClick={() => setPage((value) => value - 1)}>
                        Previous
                      </button>
                      <span>{page} / {totalPages}</span>
                      <button disabled={page === totalPages} type="button" onClick={() => setPage((value) => value + 1)}>
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function sortProducts(products: Product[], sort: SortMode) {
  const nextProducts = [...products]

  if (sort === 'latest') {
    return nextProducts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  }

  if (sort === 'price-asc') {
    return nextProducts.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
  }

  if (sort === 'price-desc') {
    return nextProducts.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price))
  }

  return nextProducts
}
