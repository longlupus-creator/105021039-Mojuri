import { FormEvent, useState } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { readRegisteredUsers, saveRegisteredUsers, toAuthUser, userInitials, type RegisteredUser } from '../utils/registeredUsers'

function makeRegisteredUser(user: { id: string; email: string; name: string; role: RegisteredUser['role'] }, password: string): RegisteredUser {
  return {
    ...user,
    phone: 'Chưa cập nhật',
    title: user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng',
    company: 'Mojuri Store',
    password,
    status: 'active',
  }
}

export default function Login() {
  const setSession = useAuthStore((state) => state.setSession)
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const [loginForm, setLoginForm] = useState({
    email: 'admin@mojuri.local',
    password: 'admin123',
  })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => readRegisteredUsers())

  function persistRegisteredUsers(users: RegisteredUser[]) {
    saveRegisteredUsers(users)
    setRegisteredUsers(users)
  }

  function upsertRegisteredUser(nextUser: RegisteredUser) {
    persistRegisteredUsers([
      nextUser,
      ...registeredUsers.filter((registeredUser) => registeredUser.id !== nextUser.id),
    ])
  }

  function markUserStatus(userId: string, status: RegisteredUser['status']) {
    persistRegisteredUsers(
      registeredUsers.map((registeredUser) =>
        registeredUser.id === userId ? { ...registeredUser, status } : registeredUser,
      ),
    )
  }

  function handleLogout() {
    const activeName = user?.name ?? 'Tài khoản'

    if (user) {
      markUserStatus(user.id, 'inactive')
    }

    logout()
    setMessage(`${activeName} đã ngưng hoạt động.`)
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await api.login(loginForm.email, loginForm.password)
      setSession(response.token, response.user)

      const registeredUser = registeredUsers.find(
        (currentUser) => currentUser.email.toLowerCase() === response.user.email.toLowerCase(),
      )

      if (registeredUser) {
        upsertRegisteredUser({ ...registeredUser, role: response.user.role, status: 'active' })
      }

      setMessage(`${response.user.name} đang hoạt động.`)
    } catch (error) {
      const localUser = registeredUsers.find(
        (registeredUser) =>
          registeredUser.email.toLowerCase() === loginForm.email.trim().toLowerCase() &&
          registeredUser.password === loginForm.password,
      )

      if (!localUser) {
        setMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại')
      } else {
        const activeUser = { ...localUser, status: 'active' as const }
        upsertRegisteredUser(activeUser)
        setSession(`local-${localUser.id}-${Date.now()}`, toAuthUser(activeUser))
        setMessage(`${localUser.name} đang hoạt động.`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await api.register(registerForm.name, registerForm.email, registerForm.password)
      const registeredUser = makeRegisteredUser(response.user, registerForm.password)

      setSession(response.token, response.user)
      upsertRegisteredUser(registeredUser)
      setMessage(`Người đăng ký ${response.user.name} đã tạo tài khoản thành công.`)
      setLoginForm({ email: registerForm.email, password: registerForm.password })
      setRegisterForm({ name: '', email: '', password: '' })
    } catch (error) {
      const email = registerForm.email.trim().toLowerCase()
      const exists = registeredUsers.some((registeredUser) => registeredUser.email.toLowerCase() === email)

      if (exists) {
        setMessage('Email này đã được đăng ký.')
      } else {
        const localUser = makeRegisteredUser(
          {
            id: `u-${Date.now()}`,
            email: registerForm.email.trim(),
            name: registerForm.name.trim(),
            role: 'user',
          },
          registerForm.password,
        )

        setSession(`local-${localUser.id}-${Date.now()}`, toAuthUser(localUser))
        upsertRegisteredUser(localUser)
        setMessage(`Người đăng ký ${localUser.name} đã tạo tài khoản thành công.`)
        setLoginForm({ email: registerForm.email, password: registerForm.password })
        setRegisterForm({ name: '', email: '', password: '' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="site-main">
      <section className="page-title">
        <div className="section-container">
          <div className="content-title-heading">
            <h1 className="text-title-heading">Login / Register</h1>
          </div>
          <div className="breadcrumbs">
            <a href="/">Home</a>
            <span className="delimiter"></span>Login / Register
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container p-l-r">
          <div className="page-login-register auth-page">
            <div className="login-admin-link">
              <a href="/admin">Trang quản trị admin</a>
            </div>

            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12 sm-m-b-50">
                <div className="box-form-login">
                  <h2>Đăng nhập</h2>
                  <form className="auth-form" onSubmit={handleLogin}>
                    <label>
                      Địa chỉ email <span className="required">*</span>
                      <input
                        className="input-text"
                        required
                        type="email"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                      />
                    </label>
                    <label>
                      Mật khẩu <span className="required">*</span>
                      <input
                        className="input-text"
                        required
                        type="password"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                      />
                    </label>
                    <div className="rememberme-lost">
                      <div className="remember-me">
                        <input type="checkbox" />
                        <label className="inline">Nhớ tôi</label>
                      </div>
                      <div className="lost-password">
                        <a href="/forgot-password">Mất mật khẩu?</a>
                      </div>
                    </div>
                    <button className="button" disabled={loading} type="submit">
                      Đăng nhập
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-6 col-md-6 col-sm-12">
                <div className="box-form-login">
                  <h2 className="register">Đăng ký</h2>
                  <form className="auth-form" onSubmit={handleRegister}>
                    <label>
                      Họ và tên <span className="required">*</span>
                      <input
                        className="input-text"
                        required
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                      />
                    </label>
                    <label>
                      Địa chỉ email <span className="required">*</span>
                      <input
                        className="input-text"
                        required
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                      />
                    </label>
                    <label>
                      Mật khẩu <span className="required">*</span>
                      <input
                        className="input-text"
                        minLength={6}
                        required
                        type="password"
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                      />
                    </label>
                    <button className="button" disabled={loading} type="submit">
                      Đăng ký
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {registeredUsers.length > 0 && (
              <div className="registered-users-panel">
                <div className="registered-users-header">
                  <span>Họ và tên</span>
                  <span>Thông tin liên lạc</span>
                  <span>Vai trò / công ty</span>
                  <span>Trạng thái</span>
                </div>
                <div className="registered-users-list">
                  {registeredUsers.map((registeredUser) => (
                    <div className="registered-user-row" key={registeredUser.id}>
                      <div className="registered-user-name">
                        <span className="registered-user-avatar">{userInitials(registeredUser.name)}</span>
                        <span>
                          <strong>{registeredUser.name}</strong>
                          <small>ID: {registeredUser.id}</small>
                        </span>
                      </div>
                      <div className="registered-user-contact">
                        <span>{registeredUser.email}</span>
                        <small>{registeredUser.phone}</small>
                      </div>
                      <div className="registered-user-role">
                        <strong>{registeredUser.title}</strong>
                        <small>{registeredUser.company}</small>
                      </div>
                      <div className="registered-user-status">
                        <span className={`registered-status-badge ${registeredUser.status === 'active' ? 'is-active' : 'is-inactive'}`}>
                          {registeredUser.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                        </span>
                        {user?.id === registeredUser.id && registeredUser.status === 'active' && (
                          <button className="registered-logout-button" type="button" onClick={handleLogout}>
                            Đăng xuất
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {message && <p className="auth-message">{message}</p>}
          </div>
        </div>
      </section>
    </main>
  )
}
