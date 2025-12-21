'use client'

import { useAuth } from '../../hooks/useAuth'

export default function AuthGuard({ 
  children, 
  requiredRole, 
  requiredRoles, 
  requiredPermission,
  fallback 
}) {
  const { user, hasRole, hasAnyRole, hasPermission } = useAuth()

  if (!user) {
    return fallback || (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    )
  }

  // Check single required role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="p-8 text-center">
        <p className="text-gray-500">You don't have permission to access this page.</p>
        <p className="text-sm text-gray-400 mt-2">Required role: {requiredRole}</p>
      </div>
    )
  }

  // Check multiple required roles (user must have at least one)
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return fallback || (
      <div className="p-8 text-center">
        <p className="text-gray-500">You don't have permission to access this page.</p>
        <p className="text-sm text-gray-400 mt-2">Required roles: {requiredRoles.join(', ')}</p>
      </div>
    )
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return fallback || (
      <div className="p-8 text-center">
        <p className="text-gray-500">You don't have permission to perform this action.</p>
        <p className="text-sm text-gray-400 mt-2">
          Required: {requiredPermission.action} access to {requiredPermission.resource}
        </p>
      </div>
    )
  }

  return children
}