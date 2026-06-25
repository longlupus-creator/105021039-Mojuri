import type { AuthUser } from '../services/api'

export type RegisteredUser = AuthUser & {
  phone: string
  title: string
  company: string
  password: string
  status: 'active' | 'inactive'
}

export const REGISTERED_USERS_KEY = 'mojuri_registered_users'

export function readRegisteredUsers() {
  const rawUsers = localStorage.getItem(REGISTERED_USERS_KEY)

  if (!rawUsers) return []

  try {
    const users = JSON.parse(rawUsers) as Array<RegisteredUser | Omit<RegisteredUser, 'status'>>

    return users.map((user) => ({
      ...user,
      status: 'status' in user ? user.status : 'inactive',
    })) as RegisteredUser[]
  } catch {
    localStorage.removeItem(REGISTERED_USERS_KEY)
    return []
  }
}

export function saveRegisteredUsers(users: RegisteredUser[]) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users))
}

export function userInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? 'U'
  const last = words.length > 1 ? words[words.length - 1][0] : ''

  return `${first}${last}`.toUpperCase()
}

export function toAuthUser(user: RegisteredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
