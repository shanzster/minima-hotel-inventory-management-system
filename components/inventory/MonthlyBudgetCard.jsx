'use client'

import { useEffect, useState } from 'react'
import budgetApi from '../../lib/budgetApi'
import { formatCurrency } from '../../lib/utils'

export default function MonthlyBudgetCard() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true)
        const currentBudget = await budgetApi.getCurrentMonthBudget()
        setBudget(currentBudget)
      } catch (err) {
        console.error('Error fetching budget:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBudget()
  }, [])

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!budget) {
    return null
  }

  const remaining = budgetApi.calculateRemaining(budget)
  const percentageUsed = budgetApi.calculatePercentageUsed(budget)
  const isOverBudget = remaining < 0

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-heading font-medium text-base text-gray-900">Monthly Budget</h3>
          <p className="text-xs text-gray-500 mt-1">Budget for this month</p>
        </div>
        <button
          onClick={() => window.location.href = '/inventory/budget'}
          className="text-xs px-2 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Edit
        </button>
      </div>

      <div className="space-y-3">
        {/* Budget Amount */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-semibold text-gray-700">Total Budget</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(budget.amount)}</span>
          </div>
        </div>

        {/* Spent Amount */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-semibold text-gray-700">Spent</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(budget.spent || 0)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                isOverBudget ? 'bg-red-500' : percentageUsed > 80 ? 'bg-amber-500' : 'bg-green-500'
              } rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
              {percentageUsed}% used
            </span>
            <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {isOverBudget ? 'Over Budget' : `${formatCurrency(remaining)} remaining`}
            </span>
          </div>
        </div>

        {/* Warning if over budget */}
        {isOverBudget && (
          <div className="bg-red-50/50 border border-red-200 rounded p-2 text-xs text-red-700">
            ⚠️ Budget exceeded by {formatCurrency(Math.abs(remaining))}
          </div>
        )}

        {/* Warning if high usage */}
        {!isOverBudget && percentageUsed > 80 && (
          <div className="bg-amber-50/50 border border-amber-200 rounded p-2 text-xs text-amber-700">
            ⚠️ Budget usage is high. {formatCurrency(remaining)} remaining
          </div>
        )}
      </div>
    </div>
  )
}
