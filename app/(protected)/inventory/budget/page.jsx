'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import Button from '../../../../components/ui/Button'
import Modal from '../../../../components/ui/Modal'
import { formatCurrency } from '../../../../lib/utils'
import budgetApi from '../../../../lib/budgetApi'

export default function BudgetManagementPage() {
  const { setTitle } = usePageTitle()
  const [budgets, setBudgets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModaBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMonth, setEditingMonth] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [purchaseOrders, setPurchaseOrders] = useState([])

  useEffect(() => {
    fetchBudgets()
    fetchPurchaseOrders()
  }, [])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const currentYear = new Date().getFullYear()
      const allBudgets = await budgetApi.getBudgetsByYear(currentYear)
      setBudgets(allBudgets)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const orders = await purchaseOrderApi.getAllPurchaseOrders()
      setPurchaseOrders(orders)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    }
  }

  const calculateMonthlySpending = (month) => {
    const currentYear = new Date().getFullYear()
    const startDate = new Date(currentYear, month - 1, 1)
    const endDate = new Date(currentYear, month, 0, 23, 59, 59)

    return purchaseOrders.reduce((total, order) => {
      const orderDate = new Date(order.createdAt)
      if (orderDate >= startDate && orderDate <= endDate) {
        return total + (order.totalAmount || 0)
      }
      return total
    }, 0)
  }

  const handleEditBudget = (budget) => {
    setEditingMonth(budget)
    setEditAmount(budget.amount.toString())
    setEditNotes(budget.notes || '')
  }

  const handleSaveBudget = async () => {
    try {
      if (!editAmount || parseFloat(editAmount) < 0) {
        alert('Please enter a valid budget amount')
        return
      }

      await budgetApi.setBudget(
        editingMonth.year,
        editingMonth.month,
        parseFloat(editAmount),
        editNotes
      )

      // Update spending
      const spent = calculateMonthlySpending(editingMonth.month)
      await budgetApi.updateBudgetSpent(
        editingMonth.year,
        editingMonth.month,
        spent
      )

      setEditingMonth(null)
      fetchBudgets()
      alert('Budget updated successfully!')
    } catch (error) {
      console.error('Error saving budget:', error)
      alert('Error saving budget')
    }
  }

  const handleCreateBudget = async (month) => {
    const budget = await budgetApi.getBudgetByMonth(new Date().getFullYear(), month)
    handleEditBudget(budget)
  }

  const handleDeleteBudget = async (year, month) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      await budgetApi.deleteBudget(year, month)
      fetchBudgets()
      alert('Budget deleted successfully!')
    } catch (error) {
      console.error('Error deleting budget:', error)
      alert('Error deleting budget')
    }
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const currentYear = new Date().getFullYear()
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const existing = budgets.find(b => b.month === month)
    const spent = calculateMonthlySpending(month)
    return {
      month,
      monthName: monthNames[i],
      budget: existing || {
        year: currentYear,
        month,
        amount: 0,
        spent,
        notes: ''
      }
    }
  })

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900">Budget Management</h1>
        <p className="text-gray-600 mt-2">Set and manage monthly budgets for purchase orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Current Month Budget */}
        {(() => {
          const now = new Date()
          const currentMonth = allMonths.find(m => m.month === now.getMonth() + 1)
          if (!currentMonth) return null

          const budget = currentMonth.budget
          const remaining = budgetApi.calculateRemaining(budget)
          const percentage = budgetApi.calculatePercentageUsed(budget)

          return (
            <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
              <p className="text-sm text-gray-600 font-medium">Current Month Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(budget.amount)}</p>
              <p className="text-xs text-gray-500 mt-1">Spent: {formatCurrency(budget.spent || 0)}</p>
              <div className="mt-3 w-full bg-gray-200/50 rounded-full h-2">
                <div
                  className={`h-full ${percentage > 80 ? 'bg-red-500' : 'bg-green-500'} rounded-full`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">{percentage}% used</p>
            </div>
          )
        })()}

        {/* Total Annual Budget */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <p className="text-sm text-gray-600 font-medium">Total Annual Budget</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(budgets.reduce((sum, b) => sum + (b.amount || 0), 0))}
          </p>
          <p className="text-xs text-gray-500 mt-1">All months combined</p>
        </div>

        {/* Total Annual Spending */}
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
          <p className="text-sm text-gray-600 font-medium">Total Annual Spending</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(purchaseOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}
          </p>
          <p className="text-xs text-gray-500 mt-1">All purchase orders</p>
        </div>
      </div>

      {/* Monthly Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allMonths.map(({ month, monthName, budget }) => {
          const spent = budget.spent || calculateMonthlySpending(month)
          const remaining = budgetApi.calculateRemaining({...budget, spent})
          const percentage = budgetApi.calculatePercentageUsed({...budget, spent})
          const isOverBudget = remaining < 0

          return (
            <div key={month} className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-semibold text-gray-900">{monthName}</h3>
                  <p className="text-xs text-gray-500">Month {month}</p>
                </div>
                <button
                  onClick={() => handleEditBudget({...budget, spent})}
                  className="text-xs px-2 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(budget.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(spent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                      } rounded-full transition-all`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{percentage}% used</p>
                </div>

                {/* Budget Notes */}
                {budget.notes && (
                  <div className="mt-2 p-2 bg-gray-50/50 rounded text-xs text-gray-600 italic">
                    &quot;{budget.notes}&quot;
                  </div>
                )}

                {/* Warnings */}
                {isOverBudget && (
                  <div className="mt-2 p-2 bg-red-50/50 border border-red-200 rounded text-xs text-red-700">
                    ⚠️ Over budget by {formatCurrency(Math.abs(remaining))}
                  </div>
                )}
                {!isOverBudget && percentage > 80 && (
                  <div className="mt-2 p-2 bg-amber-50/50 border border-amber-200 rounded text-xs text-amber-700">
                    ⚠️ High usage ({percentage}%)
                  </div>
                )}
              </div>

              {/* Delete Button */}
              {budget.amount > 0 && (
                <button
                  onClick={() => handleDeleteBudget(budget.year, month)}
                  className="mt-3 w-full text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors border border-red-200"
                >
                  Delete Budget
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {editingMonth && (
        <Modal isOpen={true} onClose={() => setEditingMonth(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">
              Edit Budget - {monthNames[editingMonth.month - 1]}
            </h2>

            <div className="space-y-4">
              {/* Current Spending Info */}
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Current Spending</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(editingMonth.spent || calculateMonthlySpending(editingMonth.month))}
                </p>
              </div>

              {/* Budget Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this budget..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  rows="3"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setEditingMonth(null)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBudget}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Save Budget
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
