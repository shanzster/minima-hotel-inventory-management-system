// Auth helpers for Minima Hotel Inventory System

export const rolePermissions = {
  'inventory-controller': {
    inventory: ['read', 'write', 'approve', 'delete'],
    purchaseOrders: ['read', 'write', 'approve', 'delete'],
    suppliers: ['read', 'write', 'approve', 'delete'],
    assets: ['read', 'write', 'approve', 'delete'],
    audits: ['read', 'write', 'approve', 'delete'],
    menuItems: ['read', 'write', 'approve'],
    reports: ['read', 'write']
  },
  'kitchen-staff': {
    menuItems: ['read', 'write'],
    inventory: ['read'],
    audits: ['read']
  },
  'purchasing-officer': {
    purchaseOrders: ['read', 'write'],
    suppliers: ['read', 'write'],
    inventory: ['read'],
    deliveries: ['read', 'write']
  }
}

// Mock user database for demonstration
const mockUsers = {
  'controller@minima.com': {
    id: '1',
    email: 'controller@minima.com',
    name: 'Mark Trinidad',
    role: 'inventory-controller',
    password: 'password123'
  },
  'kitchen@minima.com': {
    id: '2',
    email: 'kitchen@minima.com',
    name: 'Sarah Kitchen',
    role: 'kitchen-staff',
    password: 'password123'
  },
  'purchasing@minima.com': {
    id: '3',
    email: 'purchasing@minima.com',
    name: 'Mike Purchasing',
    role: 'purchasing-officer',
    password: 'password123'
  }
}

export function checkPermission(userRole, resource, action) {
  if (!userRole || !resource || !action) {
    return false
  }
  
  const permissions = rolePermissions[userRole]
  if (!permissions) {
    return false
  }
  
  const resourcePermissions = permissions[resource]
  if (!resourcePermissions) {
    return false
  }
  
  return resourcePermissions.includes(action)
}

export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null
  }
  
  const userStr = localStorage.getItem('currentUser')
  if (!userStr) {
    return null
  }
  
  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user from localStorage:', error)
    return null
  }
}

export function setCurrentUser(user) {
  if (typeof window === 'undefined') {
    return
  }
  
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user))
  } else {
    localStorage.removeItem('currentUser')
  }
}

export async function authenticateUser(email, password) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const user = mockUsers[email]
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password')
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

export function logout() {
  if (typeof window !== 'undefined') {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('currentUser')
    
    // Optional: Clear any other session data
    // localStorage.clear() // Use this if you want to clear everything
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null
}

export function hasRole(requiredRole) {
  const user = getCurrentUser()
  return user && user.role === requiredRole
}

export function hasAnyRole(requiredRoles) {
  const user = getCurrentUser()
  return user && requiredRoles.includes(user.role)
}