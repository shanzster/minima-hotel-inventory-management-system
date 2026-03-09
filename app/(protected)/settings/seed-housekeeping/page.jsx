'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, database } from '../../../../lib/firebase'
import { ref, set } from 'firebase/database'
import Button from '../../../../components/ui/Button'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { useEffect } from 'react'

export default function SeedHousekeepingPage() {
  const { setTitle } = usePageTitle()
  const [isSeeding, setIsSeeding] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    setTitle('Seed Housekeeping Accounts')
  }, [setTitle])

  const housekeepingAccounts = [
    {
      email: 'housekeeping1@hotel.com',
      password: 'housekeeping123',
      name: 'Maria Santos',
      role: 'housekeeping',
      isActive: true
    },
    {
      email: 'housekeeping2@hotel.com',
      password: 'housekeeping123',
      name: 'Ana Reyes',
      role: 'housekeeping',
      isActive: true
    }
  ]

  const handleSeedAccounts = async () => {
    setIsSeeding(true)
    setError(null)
    setResults([])
    const newResults = []

    try {
      for (const account of housekeepingAccounts) {
        try {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            account.email,
            account.password
          )
          
          const uid = userCredential.user.uid

          // Create user document in users collection with uid as document ID
          const userRef = ref(database, `users/${uid}`)
          await set(userRef, {
            id: uid, // Add id field for consistency
            email: account.email,
            name: account.name,
            role: account.role,
            active: account.isActive,
            department: 'Housekeeping',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

          newResults.push({
            email: account.email,
            name: account.name,
            status: 'success',
            message: 'Account created successfully',
            uid: uid
          })
        } catch (err) {
          // Check if user already exists
          if (err.code === 'auth/email-already-in-use') {
            newResults.push({
              email: account.email,
              name: account.name,
              status: 'exists',
              message: 'Account already exists in Firebase Auth'
            })
          } else {
            newResults.push({
              email: account.email,
              name: account.name,
              status: 'error',
              message: err.message
            })
          }
        }
      }

      setResults(newResults)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="p-4 mx-2 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seed Housekeeping Accounts</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create test housekeeping accounts in Firebase Auth and users collection
        </p>
      </div>

      {/* Accounts to be created */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts to Create</h2>
        <div className="space-y-4">
          {housekeepingAccounts.map((account, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                  <p className="text-sm font-medium text-gray-900">{account.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  <p className="text-sm font-medium text-gray-900">{account.email}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                  <p className="text-sm font-medium text-gray-900">{account.password}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                  <p className="text-sm font-medium text-gray-900">{account.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <Button
          onClick={handleSeedAccounts}
          isLoading={isSeeding}
          disabled={isSeeding}
          className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-lg font-bold"
        >
          {isSeeding ? 'Creating Accounts...' : 'Create Housekeeping Accounts'}
        </Button>
      </div>

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
                    : result.status === 'exists'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      {result.status === 'success' && (
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {result.status === 'exists' && (
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                      {result.status === 'error' && (
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <h3 className="font-bold text-gray-900">{result.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{result.email}</p>
                    <p className={`text-sm mt-1 ${
                      result.status === 'success'
                        ? 'text-green-700'
                        : result.status === 'exists'
                        ? 'text-blue-700'
                        : 'text-red-700'
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
        <h3 className="text-sm font-bold text-blue-900 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click the button above to create housekeeping accounts</li>
          <li>• Accounts will be created in both Firebase Auth and users collection</li>
          <li>• If an account already exists, it will be skipped</li>
          <li>• Default password for all accounts: <code className="bg-blue-100 px-1 rounded">housekeeping123</code></li>
          <li>• You can use these accounts to test housekeeping features</li>
        </ul>
      </div>
    </div>
  )
}
