'use client'

import { useState, useEffect } from 'react'
import { database } from '../../lib/firebase'
import { ref, get, update } from 'firebase/database'

export default function FixUsersPublicPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const usersRef = ref(database, 'users')
      const snapshot = await get(usersRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const usersList = Object.keys(data).map(uid => ({
          uid,
          ...data[uid],
          needsFix: !data[uid].id || data[uid].id !== uid
        }))
        setUsers(usersList)
      }
    } catch (err) {
      setError('Failed to load users: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFixUsers = async () => {
    setIsFixing(true)
    setError(null)
    setResults([])
    const newResults = []

    try {
      const usersToFix = users.filter(u => u.needsFix)

      for (const user of usersToFix) {
        try {
          const userRef = ref(database, `users/${user.uid}`)
          await update(userRef, {
            id: user.uid
          })

          newResults.push({
            name: user.name,
            email: user.email,
            uid: user.uid,
            status: 'success',
            message: 'ID field added successfully'
          })
        } catch (err) {
          newResults.push({
            name: user.name,
            email: user.email,
            uid: user.uid,
            status: 'error',
            message: err.message
          })
        }
      }

      setResults(newResults)
      await loadUsers() // Reload to update the list
    } catch (err) {
      setError(err.message)
    } finally {
      setIsFixing(false)
    }
  }

  const usersNeedingFix = users.filter(u => u.needsFix)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Fix User Documents</h1>
          <p className="text-sm text-gray-600 mt-1">
            Add missing ID fields to user documents
          </p>
        </div>

        {/* Current Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current Users ({users.length})
          </h2>
          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  user.needsFix ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      {user.needsFix ? (
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Role: {user.role} | Active: {user.active ? 'Yes' : 'No'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      UID: {user.uid}
                    </p>
                    {user.needsFix && (
                      <p className="text-xs text-yellow-700 mt-2 font-medium">
                        ⚠️ Missing or incorrect ID field - needs fixing
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {usersNeedingFix.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleFixUsers}
              disabled={isFixing}
              className="w-full bg-black text-white hover:bg-gray-800 px-8 py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isFixing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fixing Users...
                </span>
              ) : (
                `Fix ${usersNeedingFix.length} User${usersNeedingFix.length > 1 ? 's' : ''}`
              )}
            </button>
          </div>
        )}

        {usersNeedingFix.length === 0 && users.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-green-800">All Users Are OK! ✓</h3>
                <p className="text-sm text-green-700">All user documents have the correct ID field. You can now try logging in.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Results</h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        {result.status === 'success' ? (
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <h3 className="font-bold text-gray-900">{result.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{result.email}</p>
                      <p className={`text-sm mt-1 ${
                        result.status === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {results.every(r => r.status === 'success') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href="/login"
                  className="block w-full bg-green-600 text-white hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-lg text-center transition-all"
                >
                  Go to Login Page →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">What This Does</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Scans all user documents in the database</li>
            <li>• Identifies users missing the <code className="bg-blue-100 px-1 rounded">id</code> field</li>
            <li>• Adds the <code className="bg-blue-100 px-1 rounded">id</code> field with the correct UID value</li>
            <li>• This fixes the "User data not found" login error</li>
            <li>• After fixing, you can log in with your housekeeping accounts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
