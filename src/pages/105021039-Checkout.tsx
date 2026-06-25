import { FormEvent, useEffect, useState } from 'react'
import { api, Order } from '../services/api'
import { cartTotals, useCartStore } from '../stores/cartStore'

const emptyCustomer = {
  name: '',
  phone: '',
  email: '',
  address: '',
}

export default function Checkout() {
  const items = useCartStore((state) => state.items)
  const hydrate = useCartStore((state) => state.hydrate)
  const clearCart = useCartStore((state) => state.clearCart)
  const [customer, setCustomer] = useState(emptyCustomer)
  const [message, setMessage] = useState('')
  const [lookupId, setLookupId] = useState('')
  const [lookupOrder, setLookupOrder] = useState<Order | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const totals = cartTotals(items)

  useEffect(() => {
    hydrate()
  }, [])

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setPlacingOrder(true)

    try {
      const response = await api.createOrder({
        customer,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })
      clearCart()
      setCustomer(emptyCustomer)
      setLookupId(response.data.id)
      setLookupOrder(response.data)
      setMessage(`Đã tạo đơn hàng ${response.data.id}. Trạng thái: ${response.data.status}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tạo đơn hàng')
    } finally {
      setPlacingOrder(false)
    }
  }

  async function lookupStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLookupOrder(null)
    setMessage('')
    try {
      const response = await api.getOrder(lookupId)
      setLookupOrder(response.data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tìm thấy đơn hàng')
    }
  }

  return (
    <main className="site-main">
      <section className="page-title">
        <div className="section-container">
          <h1 className="text-title-heading">Checkout</h1>
          <div className="breadcrumbs">
            <a href="/">Home</a>
            <span className="delimiter"></span>Checkout
          </div>
        </div>
      </section>

      <section className="section-padding section-container p-l-r checkout-dynamic">
        <form className="checkout-form" onSubmit={submitOrder}>
          <h3>Thông tin nhận hàng</h3>
          <input required placeholder="Họ và tên" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
          <input required placeholder="Số điện thoại" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
          <input required placeholder="Email" type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
          <textarea required placeholder="Địa chỉ giao hàng" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} />
          <button className="button" disabled={items.length === 0 || placingOrder} type="submit">
            {placingOrder ? 'Đang tạo đơn...' : 'Đặt hàng'}
          </button>
        </form>

        <aside className="checkout-review-order">
          <h3>Đơn hàng của bạn</h3>
          {items.map((item) => (
            <div className="cart-item" key={item.productId}>
              <span>{item.name} × {item.quantity}</span>
              <strong>${item.price * item.quantity}</strong>
            </div>
          ))}
          <div className="order-total">Tạm tính: ${totals.subtotal}</div>
          <div className="order-total">Phí giao hàng: ${totals.shippingFee}</div>
          <div className="order-total">Tổng cộng: ${totals.total}</div>
          {message && <p className="admin-message">{message}</p>}
        </aside>

        <form className="order-lookup" onSubmit={lookupStatus}>
          <h3>Tra cứu đơn hàng</h3>
          <input placeholder="Mã đơn hàng" value={lookupId} onChange={(event) => setLookupId(event.target.value)} />
          <button type="submit">Kiểm tra trạng thái</button>
          {lookupOrder && (
            <p>
              {lookupOrder.id}: <strong>{lookupOrder.status}</strong> - Tổng ${lookupOrder.total}
            </p>
          )}
        </form>
      </section>
    </main>
  )
}
