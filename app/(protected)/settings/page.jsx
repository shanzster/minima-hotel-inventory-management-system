'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../../hooks/useAuth'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Badge from '../../../components/ui/Badge'

export default function SettingsPage() {
  const { setTitle } = usePageTitle()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    bio: ''
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    orderApprovals: true,
    deliveryUpdates: true,
    theme: 'light',
    language: 'en'
  })

  useEffect(() => {
    setTitle('Settings')
    
    // Load user data
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || ''
      })
    }

    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem('userPreferences')
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences))
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }
  }, [setTitle, user])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update user in localStorage
      const updatedUser = {
        ...user,
        ...profileForm
      }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))

      setSuccessMessage('Profile updated successfully!')
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    setIsSaving(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccessMessage('Password changed successfully!')
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)

      // Clear password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences))

      setSuccessMessage('Preferences saved successfully!')
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'inventory-controller':
        return 'success'
      case 'purchasing-officer':
        return 'warning'
      case 'kitchen-staff':
        return 'normal'
      default:
        return 'normal'
    }
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'inventory-controller':
        return 'Inventory Controller'
      case 'purchasing-officer':
        return 'Purchasing Officer'
      case 'kitchen-staff':
        return 'Kitchen Staff'
      default:
        return role
    }
  }

  return (
    <div className="p-4 mx-2">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500 font-body text-sm">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <div className="mt-2">
              <Badge variant={getRoleBadgeVariant(user?.role)}>
                {getRoleDisplayName(user?.role)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
        <div className="border-b border-white/20">
          <div className="flex space-x-1 p-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'security'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'preferences'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Preferences
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(value) => setProfileForm({ ...profileForm, name: value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(value) => setProfileForm({ ...profileForm, email: value })}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(value) => setProfileForm({ ...profileForm, phone: value })}
                    placeholder="+63 XXX XXX XXXX"
                  />
                  <Input
                    label="Department"
                    value={profileForm.department}
                    onChange={(value) => setProfileForm({ ...profileForm, department: value })}
                    placeholder="e.g., Inventory Management"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/20"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
                    required
                    placeholder="At least 8 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 text-sm mb-1">Password Requirements</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Mix of uppercase and lowercase letters</li>
                      <li>• Include numbers and special characters</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSaving ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesUpdate} className="space-y-6">
              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Email Notifications</div>
                        <div className="text-sm text-gray-600">Receive email updates about system activities</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                      className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Low Stock Alerts</div>
                        <div className="text-sm text-gray-600">Get notified when items reach restock threshold</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.lowStockAlerts}
                      onChange={(e) => setPreferences({ ...preferences, lowStockAlerts: e.target.checked })}
                      className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Order Approvals</div>
                        <div className="text-sm text-gray-600">Notifications for purchase order approvals</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.orderApprovals}
                      onChange={(e) => setPreferences({ ...preferences, orderApprovals: e.target.checked })}
                      className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Delivery Updates</div>
                        <div className="text-sm text-gray-600">Track delivery status and receive updates</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.deliveryUpdates}
                      onChange={(e) => setPreferences({ ...preferences, deliveryUpdates: e.target.checked })}
                      className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">Display Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/20"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/20"
                    >
                      <option value="en">English</option>
                      <option value="fil">Filipino</option>
                      <option value="ja">日本語 (Japanese)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-2xl p-4 max-w-md">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Success!</h4>
                <p className="text-sm text-gray-600">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}