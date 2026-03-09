'use client'

import { useState, useEffect } from 'react'
import { database } from '../../../../lib/firebase'
import { ref, get, update } from 'firebase/database'
import Button from '../../../../components/ui/Button'
import { usePageTitle } from '../../../../hooks/usePageTitle'

export default function FixUsersPage() {
  const { setTitle } = usePageTitle()
  const [isFixing, setIsFixing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    setTitle('Fix User Documents')
    loadUsers()
  }, [setTitle])

  const loadUsers = async () => {
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

  return (
    <div className="p-4 mx-2 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fix User Documents</h1>
        <p className="text-sm text-gray-600 mt-1">
          Add missing ID fields to user documents
        </p>
      </div>

      {/* Current Users */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
                    Role: {user.role} | UID: {user.uid}
                  </p>
                  {user.needsFix && (
                    <p className="text-xs text-yellow-700 mt-1 font-medium">
                      ⚠️ Missing or incorrect ID field
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
          <Button
            onClick={handleFixUsers}
            isLoading={isFixing}
            disabled={isFixing}
            className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-lg font-bold"
          >
            {isFixing ? 'Fixing Users...' : `Fix ${usersNeedingFix.length} User${usersNeedingFix.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {usersNeedingFix.length === 0 && users.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-bold text-green-800">All Users Are OK</h3>
              <p className="text-sm text-green-700">All user documents have the correct ID field.</p>
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
        </ul>
      </div>
    </div>
  )
}
