import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, AdminUser, BlogPost, ContactMessage, Order, OrderStats, OrderStatus, Product } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { readRegisteredUsers, saveRegisteredUsers, toAuthUser, type RegisteredUser } from '../../utils/registeredUsers'

type Tab = 'products' | 'users' | 'orders' | 'contacts' | 'blogs'

const productFormDefaults = {
  name: '',
  category: 'Rings',
  description: '',
  price: '',
  salePrice: '',
  stock: '',
  status: 'in-stock' as Product['status'],
  image: '/media/product/1.jpg',
  gallery: '/media/product/1.jpg,/media/product/1-2.jpg',
  featured: false,
}

const blogFormDefaults = {
  title: '',
  category: 'Tips',
  excerpt: '',
  content: '',
  coverImage: '/media/blog/1.jpg',
  status: 'published' as BlogPost['status'],
}

const orderStatsDefaults: OrderStats = {
  totalRevenue: 0,
  totalOrders: 0,
  pendingOrders: 0,
  todayRevenue: 0,
  monthRevenue: 0,
  revenueByDay: {},
  revenueByMonth: {},
}

export default function AdminDashboard() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const logout = useAuthStore((state) => state.logout)
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => readRegisteredUsers())
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats>(orderStatsDefaults)
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>(['Rings', 'Necklaces', 'Earrings', 'Bracelets'])
  const [email, setEmail] = useState('admin@mojuri.local')
  const [password, setPassword] = useState('admin123')
  const [productForm, setProductForm] = useState(productFormDefaults)
  const [blogForm, setBlogForm] = useState(blogFormDefaults)
  const [editingProductId, setEditingProductId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      totalStock: products.reduce((sum, product) => sum + product.stock, 0),
      unread: contacts.filter((contact) => contact.status === 'unread').length,
    }),
    [contacts, products],
  )

  async function loadAll(activeToken = token) {
    if (!activeToken) return
    setLoading(true)
    setMessage('')
    try {
      const [categoryResponse, productResponse, usersResponse, orderResponse, contactResponse, blogResponse] = await Promise.all([
        api.getCategories(),
        api.getAdminProducts(activeToken),
        api.getAdminUsers(activeToken),
        api.getAdminOrders(activeToken),
        api.getAdminContacts(activeToken),
        api.getAdminBlogs(activeToken),
      ])
      setCategories(categoryResponse.data.products)
      setProducts(productResponse.data)
      setAdminUsers(usersResponse.data)
      setOrders(orderResponse.data)
      setOrderStats(orderResponse.stats)
      setContacts(contactResponse.data)
      setBlogs(blogResponse.data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const response = await api.login(email, password)
      if (response.user.role !== 'admin') {
        setMessage('Tài khoản này chưa có quyền admin.')
        return
      }
      setSession(response.token, response.user)
      await loadAll(response.token)
    } catch (error) {
      const localAdmin = registeredUsers.find(
        (registeredUser) =>
          registeredUser.email.toLowerCase() === email.trim().toLowerCase() &&
          registeredUser.password === password &&
          registeredUser.role === 'admin',
      )

      if (!localAdmin) {
        setMessage(error instanceof Error ? error.message : 'Login failed')
      } else {
        const activeAdmin = { ...localAdmin, status: 'active' as const }
        updateRegisteredUsers(registeredUsers.map((registeredUser) => (registeredUser.id === activeAdmin.id ? activeAdmin : registeredUser)))
        setSession(`local-admin-${activeAdmin.id}-${Date.now()}`, toAuthUser(activeAdmin))
        setMessage(`${activeAdmin.name} đã đăng nhập admin.`)
      }
    } finally {
      setLoading(false)
    }
  }

  function updateRegisteredUsers(users: RegisteredUser[]) {
    saveRegisteredUsers(users)
    setRegisteredUsers(users)
  }

  function updateRegisteredUserRole(userId: string, role: RegisteredUser['role']) {
    updateRegisteredUsers(
      registeredUsers.map((registeredUser) =>
        registeredUser.id === userId
          ? {
              ...registeredUser,
              role,
              title: role === 'admin' ? 'Quản trị viên' : 'Khách hàng',
            }
          : registeredUser,
      ),
    )
    setMessage(`Đã cấp quyền ${role}.`)
  }

  function updateRegisteredUserStatus(userId: string, status: RegisteredUser['status']) {
    const nextUsers = registeredUsers.map((registeredUser) =>
      registeredUser.id === userId ? { ...registeredUser, status } : registeredUser,
    )
    updateRegisteredUsers(nextUsers)

    if (status === 'inactive' && user?.id === userId) {
      logout()
    }

    setMessage(status === 'active' ? 'Đã đánh dấu tài khoản đang hoạt động.' : 'Đã đăng xuất tài khoản.')
  }

  function deleteRegisteredUser(userId: string) {
    const targetUser = registeredUsers.find((registeredUser) => registeredUser.id === userId)
    updateRegisteredUsers(registeredUsers.filter((registeredUser) => registeredUser.id !== userId))

    if (user?.id === userId) {
      logout()
    }

    setMessage(targetUser ? `Đã xóa tài khoản ${targetUser.name}.` : 'Đã xóa tài khoản.')
  }

  function handleAdminLogout() {
    if (user) {
      updateRegisteredUsers(
        registeredUsers.map((registeredUser) =>
          registeredUser.id === user.id ? { ...registeredUser, status: 'inactive' } : registeredUser,
        ),
      )
    }

    logout()
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      name: productForm.name,
      category: productForm.category,
      description: productForm.description,
      price: Number(productForm.price),
      salePrice: productForm.salePrice ? Number(productForm.salePrice) : undefined,
      stock: Number(productForm.stock),
      status: productForm.status,
      image: productForm.image,
      gallery: productForm.gallery.split(',').map((item) => item.trim()).filter(Boolean),
      featured: productForm.featured,
    }
    try {
      if (editingProductId) {
        await api.updateProduct(token, editingProductId, payload)
      } else {
        await api.createProduct(token, payload)
      }
      setProductForm(productFormDefaults)
      setEditingProductId('')
      await loadAll()
      setMessage('Product saved successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot save product')
    }
  }

  async function saveBlog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await api.createBlog(token, blogForm)
      setBlogForm(blogFormDefaults)
      await loadAll()
      setMessage('Blog post created successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cannot save blog')
    }
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id)
    setProductForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price: String(product.price),
      salePrice: String(product.salePrice ?? ''),
      stock: String(product.stock),
      status: product.status,
      image: product.image,
      gallery: product.gallery.join(','),
      featured: product.featured,
    })
    setTab('products')
  }

  async function changeOrderStatus(orderId: string, status: OrderStatus) {
    try {
      await api.updateOrderStatus(token, orderId, status)
      await loadAll()
      setMessage(`Đã cập nhật đơn hàng ${orderId} sang trạng thái ${status}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không cập nhật được trạng thái đơn hàng')
    }
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">Mojuri</a>
        <a className="admin-back-login" href="/login">Quay lại đăng nhập</a>
        <nav className="admin-nav">
          {(['products', 'users', 'orders', 'contacts', 'blogs'] as Tab[]).map((item) => (
            <button className={tab === item ? 'active' : ''} key={item} type="button" onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Admin Dashboard</p>
            <h1>{tab[0].toUpperCase() + tab.slice(1)}</h1>
          </div>
          {user && (
            <div className="admin-user">
              <span>{user.name}</span>
              <button type="button" onClick={handleAdminLogout}>Logout</button>
            </div>
          )}
        </header>

        {!token ? (
          <form className="admin-panel admin-login" onSubmit={handleLogin}>
            <h2>Sign in</h2>
            <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login as admin'}</button>
            {message && <p className="admin-message">{message}</p>}
          </form>
        ) : (
          <>
            <div className="admin-stats">
              <article><span>Products</span><strong>{stats.totalProducts}</strong></article>
              <article><span>Users</span><strong>{adminUsers.length}</strong></article>
              <article><span>Stock</span><strong>{stats.totalStock}</strong></article>
              <article><span>Orders</span><strong>{orderStats.totalOrders}</strong></article>
              <article><span>Pending</span><strong>{orderStats.pendingOrders}</strong></article>
              <article><span>Today revenue</span><strong>${orderStats.todayRevenue}</strong></article>
              <article><span>Month revenue</span><strong>${orderStats.monthRevenue}</strong></article>
              <article><span>Total revenue</span><strong>${orderStats.totalRevenue}</strong></article>
              <article><span>Unread</span><strong>{stats.unread}</strong></article>
            </div>

            {message && <p className="admin-message">{message}</p>}

            {tab === 'products' && (
              <>
                <form className="admin-panel admin-form-grid" onSubmit={saveProduct}>
                  <h2>{editingProductId ? 'Edit product' : 'Create product'}</h2>
                  <input required placeholder="Name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
                  <select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input required min="1" placeholder="Price" type="number" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} />
                  <input min="0" placeholder="Sale price" type="number" value={productForm.salePrice} onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })} />
                  <input required min="0" placeholder="Stock" type="number" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} />
                  <select value={productForm.status} onChange={(event) => setProductForm({ ...productForm, status: event.target.value as Product['status'] })}>
                    <option value="in-stock">In stock</option>
                    <option value="out-of-stock">Out of stock</option>
                  </select>
                  <input placeholder="Thumbnail URL" value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} />
                  <input placeholder="Gallery URLs comma separated" value={productForm.gallery} onChange={(event) => setProductForm({ ...productForm, gallery: event.target.value })} />
                  <textarea placeholder="Rich text description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
                  <label className="admin-checkbox"><input checked={productForm.featured} type="checkbox" onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} /> Trending</label>
                  <button type="submit">Save product</button>
                </form>
                <AdminTable headers={['Name', 'Category', 'Price', 'Stock', 'Status', 'Actions']}>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td><td>{product.category}</td><td>${product.salePrice ?? product.price}</td><td>{product.stock}</td><td>{product.status}</td>
                      <td>
                        <button type="button" onClick={() => editProduct(product)}>Edit</button>
                        <button type="button" onClick={async () => { await api.deleteProduct(token, product.id); await loadAll() }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </AdminTable>
              </>
            )}

            {tab === 'users' && (
              <>
                <AdminTable headers={['Name', 'Email', 'Role', 'Status', 'Actions']}>
                  {registeredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Chưa có tài khoản nào đăng ký trên trang Login.</td>
                    </tr>
                  ) : (
                    registeredUsers.map((registeredUser) => (
                      <tr key={registeredUser.id}>
                        <td>{registeredUser.name}</td>
                        <td>{registeredUser.email}</td>
                        <td>
                          <select
                            value={registeredUser.role}
                            onChange={(event) => updateRegisteredUserRole(registeredUser.id, event.target.value as RegisteredUser['role'])}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>
                          <span className={`admin-status ${registeredUser.status === 'active' ? 'active' : 'inactive'}`}>
                            {registeredUser.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                          </span>
                        </td>
                        <td>
                          <button type="button" onClick={() => updateRegisteredUserStatus(registeredUser.id, 'active')}>
                            Đăng nhập
                          </button>
                          <button type="button" onClick={() => updateRegisteredUserStatus(registeredUser.id, 'inactive')}>
                            Đăng xuất
                          </button>
                          <button type="button" onClick={() => deleteRegisteredUser(registeredUser.id)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </AdminTable>

                <AdminTable headers={['Backend user', 'Email', 'Role', 'Actions']}>
                  {adminUsers.map((adminUser) => (
                    <tr key={adminUser.id}>
                      <td>{adminUser.name}</td>
                      <td>{adminUser.email}</td>
                      <td>
                        <select
                          value={adminUser.role}
                          onChange={async (event) => {
                            await api.updateUserRole(token, adminUser.id, event.target.value as AdminUser['role'])
                            await loadAll()
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        <span>{adminUser.id === user?.id ? 'Current account' : 'Can change role'}</span>
                        {adminUser.id !== user?.id && (
                          <button
                            type="button"
                            onClick={async () => {
                              await api.deleteUser(token, adminUser.id)
                              await loadAll()
                              setMessage(`Đã xóa tài khoản ${adminUser.name}.`)
                            }}
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </AdminTable>
              </>
            )}

            {tab === 'orders' && (
              <AdminTable headers={['Order', 'Customer', 'Products', 'Total', 'Status', 'Created']}>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Chưa có đơn hàng nào.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.id}</strong>
                      </td>
                      <td>
                        <strong>{order.customer.name}</strong>
                        <small>{order.customer.phone}</small>
                        <small>{order.customer.email}</small>
                        <small>{order.customer.address}</small>
                      </td>
                      <td>
                        {order.items.map((item) => (
                          <small key={`${order.id}-${item.productId}`}>
                            {item.name} x {item.quantity}
                          </small>
                        ))}
                      </td>
                      <td>
                        <strong>${order.total}</strong>
                        <small>Tạm tính ${order.subtotal}</small>
                        <small>Ship ${order.shippingFee}</small>
                      </td>
                      <td>
                        <select value={order.status} onChange={(event) => changeOrderStatus(order.id, event.target.value as OrderStatus)}>
                          {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </AdminTable>
            )}

            {tab === 'contacts' && (
              <AdminTable headers={['Name', 'Email', 'Subject', 'Status', 'Message', 'Actions']}>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>{contact.name}</td><td>{contact.email}</td><td>{contact.subject}</td><td>{contact.status}</td><td>{contact.message}</td>
                    <td><button type="button" onClick={async () => { await api.markContactRead(token, contact.id); await loadAll() }}>Mark read</button></td>
                  </tr>
                ))}
              </AdminTable>
            )}

            {tab === 'blogs' && (
              <>
                <form className="admin-panel admin-form-grid" onSubmit={saveBlog}>
                  <h2>Create blog post</h2>
                  <input required placeholder="Title" value={blogForm.title} onChange={(event) => setBlogForm({ ...blogForm, title: event.target.value })} />
                  <select value={blogForm.category} onChange={(event) => setBlogForm({ ...blogForm, category: event.target.value })}>
                    {['Tips', 'Collections', 'News'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input placeholder="Cover image" value={blogForm.coverImage} onChange={(event) => setBlogForm({ ...blogForm, coverImage: event.target.value })} />
                  <select value={blogForm.status} onChange={(event) => setBlogForm({ ...blogForm, status: event.target.value as BlogPost['status'] })}>
                    <option value="published">published</option><option value="draft">draft</option>
                  </select>
                  <textarea required placeholder="Excerpt" value={blogForm.excerpt} onChange={(event) => setBlogForm({ ...blogForm, excerpt: event.target.value })} />
                  <textarea required placeholder="Rich text content" value={blogForm.content} onChange={(event) => setBlogForm({ ...blogForm, content: event.target.value })} />
                  <button type="submit">Publish post</button>
                </form>
                <AdminTable headers={['Title', 'Category', 'Status', 'Published']}>
                  {blogs.map((blog) => (
                    <tr key={blog.id}><td>{blog.title}</td><td>{blog.category}</td><td>{blog.status}</td><td>{new Date(blog.publishedAt).toLocaleDateString()}</td></tr>
                  ))}
                </AdminTable>
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}

function AdminTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="admin-panel">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}
