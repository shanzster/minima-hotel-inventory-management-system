// Auth helpers for Minima Hotel Inventory System
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from './firebase'
import { firebaseDB } from './firebase'

export const rolePermissions = {
  'admin': {
    inventory: ['read', 'write', 'approve', 'delete'],
    purchaseOrders: ['read', 'write', 'approve', 'delete'],
    suppliers: ['read', 'write', 'approve', 'delete'],
    assets: ['read', 'write', 'approve', 'delete'],
    audits: ['read', 'write', 'approve', 'delete'],
    menuItems: ['read', 'write', 'approve'],
    reports: ['read', 'write'],
    bundles: ['read', 'write', 'approve', 'delete'],
    users: ['read', 'write', 'approve', 'delete'],
    rooms: ['read', 'write', 'approve', 'delete'],
    housekeeping: ['read', 'write']
  },
  'inventory-controller': {
    inventory: ['read', 'write', 'approve', 'delete'],
    purchaseOrders: ['read', 'write', 'approve', 'delete'],
    suppliers: ['read', 'write', 'approve', 'delete'],
    assets: ['read', 'write', 'approve', 'delete'],
    audits: ['read', 'write', 'approve', 'delete'],
    menuItems: ['read', 'write', 'approve'],
    reports: ['read', 'write'],
    bundles: ['read', 'write', 'approve', 'delete']
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
  },
  'housekeeping': {
    housekeeping: ['read', 'write'],
    bundles: ['read'],
    rooms: ['read']
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
  if (!auth) {
    throw new Error('Firebase Auth is not initialized')
  }

  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user data from users collection
    const userData = await firebaseDB.readById('users', firebaseUser.uid)
    
    if (!userData) {
      throw new Error('User data not found in database')
    }

    // Check if user is active
    if (userData.active === false) {
      throw new Error('This account has been deactivated. Please contact your administrator.')
    }

    // Return user data without sensitive information
    const userWithoutSensitive = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      firebaseUid: firebaseUser.uid
    }

    return userWithoutSensitive
  } catch (error) {
    console.error('Authentication error:', error)
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address')
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.')
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.')
    } else {
      throw new Error(error.message || 'Authentication failed')
    }
  }
}

export async function logout() {
  if (typeof window !== 'undefined') {
    // Mark that user has logged out to prevent auto-login
    localStorage.setItem('hasLoggedOut', 'true')

    // Clear all auth-related data from localStorage
    localStorage.removeItem('currentUser')

    // Clear session storage
    sessionStorage.clear()

    // Clear any other auth-related localStorage keys
    const keysToRemove = ['authToken', 'sessionId', 'userPreferences']
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  // Sign out from Firebase Auth
  if (auth) {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out from Firebase:', error)
    }
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

// Listen to Firebase Auth state changes
export function onAuthStateChange(callback) {
  if (!auth) {
    return () => {}
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Get user data from database
        const userData = await firebaseDB.readById('users', firebaseUser.uid)
        
        if (userData && userData.active !== false) {
          const userWithoutSensitive = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            firebaseUid: firebaseUser.uid
          }
          callback(userWithoutSensitive)
        } else {
          callback(null)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}
