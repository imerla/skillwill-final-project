export const ROUTES = {
  catalog: '/catalog',
  product: (slug: string) => `/product/${slug}`,
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,
  profile: '/profile',
} as const

