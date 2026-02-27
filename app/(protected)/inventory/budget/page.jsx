'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import Button from '../../../../components/ui/Button'
import Modal from '../../../../components/ui/Modal'
import { formatCurrency } from '../../../../lib/utils'
import budgetApi from '../../../../lib/budgetApi'
import purchaseOrderApi from '../../../../lib/purchaseOrderApi'
import toast from '../../../../lib/toast'

export default function BudgetManagementPage() {
  const { setTitle } = usePageTitle()
  const [budgets, setBudgets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('monthly') // 'monthly' | 'yearly' | 'reports'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
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
      const allBudgets = await budgetApi.getBudgetsByYear(selectedYear)
      setBudgets(allBudgets)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [selectedYear])

  const fetchPurchaseOrders = async () => {
    try {
      const orders = await purchaseOrderApi.getAll()
      setPurchaseOrders(orders)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    }
  }

  const calculateMonthlySpending = (month) => {
    const startDate = new Date(selectedYear, month - 1, 1)
    const endDate = new Date(selectedYear, month, 0, 23, 59, 59)

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
    setEditAmount((budget.amount || 0).toString())
    setEditNotes(budget.notes || '')
  }

  const handleSaveBudget = async () => {
    try {
      if (!editAmount || parseFloat(editAmount) < 0) {
        toast.warning('Please enter a valid budget amount')
        return
      }

      await budgetApi.setBudget(
        selectedYear,
        editingMonth.month,
        parseFloat(editAmount),
        editNotes
      )

      // Update spending
      const spent = calculateMonthlySpending(editingMonth.month)
      await budgetApi.updateBudgetSpent(
        selectedYear,
        editingMonth.month,
        spent
      )

      setEditingMonth(null)
      fetchBudgets()
      toast.success('Budget updated successfully!')
    } catch (error) {
      console.error('Error saving budget:', error)
      toast.error('Error saving budget. Please try again.')
    }
  }

  const handleCreateBudget = async (month) => {
    const budget = await budgetApi.getBudgetByMonth(selectedYear, month)
    handleEditBudget(budget)
  }

  const handleDeleteBudget = async (year, month) => {
    // We don't have a custom confirm modal yet, preserving the simple confirm logic 
    // but we can at least toast the result
    if (!window.confirm('Are you sure you want to delete this budget?')) return

    try {
      await budgetApi.deleteBudget(year, month)
      fetchBudgets()
      toast.success('Budget deleted successfully!')
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast.error('Error deleting budget')
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
        year: selectedYear,
        month,
        amount: 0,
        spent,
        notes: ''
      }
    }
  })

  // Yearly Aggregates
  const totalAnnualBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalAnnualSpending = purchaseOrders.reduce((sum, o) => {
    const orderYear = new Date(o.createdAt).getFullYear()
    return orderYear === selectedYear ? sum + (o.totalAmount || 0) : sum
  }, 0)
  const annualRemaining = Math.max(0, totalAnnualBudget - totalAnnualSpending)
  const annualPercentage = totalAnnualBudget > 0 ? Math.round((totalAnnualSpending / totalAnnualBudget) * 100) : 0

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="p-0 min-h-screen bg-gray-50/50">
      <div className="p-8">
        {/* Header & Year Picker */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-heading font-bold text-gray-900 tracking-tight">Budget Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage and monitor inventory procurement budgets</p>
          </div>

          <div className="flex items-center space-x-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500 px-3">Year:</span>
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === year
                  ? 'bg-black text-white shadow-lg scale-105'
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-200/50 p-1.5 rounded-2xl w-full max-w-md">
          {[
            { id: 'monthly', label: 'Monthly View' },
            { id: 'yearly', label: 'Yearly Overview' },
            { id: 'reports', label: 'Visual Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                ? 'bg-white text-black shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'monthly' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allMonths.map(({ month, monthName, budget }) => {
                const spent = calculateMonthlySpending(month)
                const remaining = budget.amount - spent
                const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0
                const isOverBudget = spent > budget.amount && budget.amount > 0

                return (
                  <div key={month} className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-black/5 transition-all duration-500 relative overflow-hidden">
                    {/* Glassmorphism Background Decoration */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-heading font-bold text-gray-900">{monthName}</h3>
                        <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mt-1">{selectedYear}</p>
                      </div>
                      <button
                        onClick={() => handleEditBudget({ ...budget, spent })}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-black hover:text-white transition-all transform hover:scale-110"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-tight">Budget</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(budget.amount)}</span>
                      </div>

                      {/* Fancy Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={isOverBudget ? 'text-red-500' : 'text-gray-400'}>
                            Spent: {formatCurrency(spent)}
                          </span>
                          <span className={isOverBudget ? 'text-red-500' : 'text-gray-400'}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-red-500' : percentage > 90 ? 'bg-amber-500' : 'bg-black'
                              }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Remaining</span>
                        <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>

                      {budget.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-2xl text-[10px] text-gray-500 italic leading-relaxed">
                          &quot;{budget.notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'yearly' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              {/* Total Annual Summary */}
              <div className="bg-black rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-1000"></div>

                <div className="relative grid md:grid-cols-3 gap-12 text-center md:text-left">
                  <div className="space-y-2">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Total Annual Budget</p>
                    <p className="text-5xl font-heading font-bold">{formatCurrency(totalAnnualBudget)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Total Spent to Date</p>
                    <p className="text-5xl font-heading font-bold">{formatCurrency(totalAnnualSpending)}</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Overall Utilization</p>
                    <div className="flex items-center gap-4">
                      <p className="text-5xl font-heading font-bold">{annualPercentage}%</p>
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(annualPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Table View */}
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-xl font-heading font-bold">Annual Breakdown</h3>
                  <Button variant="ghost" size="sm" className="font-bold text-gray-400 hover:text-black">
                    Export PDF
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Month</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Budget</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actual Spent</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Variance</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allMonths.map(({ month, monthName, budget }) => {
                        const spent = calculateMonthlySpending(month)
                        const variance = budget.amount - spent
                        const isOver = spent > budget.amount && budget.amount > 0

                        return (
                          <tr key={month} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6 font-bold text-gray-900">{monthName}</td>
                            <td className="px-8 py-6 font-medium">{formatCurrency(budget.amount)}</td>
                            <td className="px-8 py-6 font-medium">{formatCurrency(spent)}</td>
                            <td className={`px-8 py-6 font-bold ${variance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                            </td>
                            <td className="px-8 py-6">
                              {budget.amount === 0 ? (
                                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Unset</span>
                              ) : isOver ? (
                                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Over Budget</span>
                              ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">On Track</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8">
              {/* Custom SVG Performance Chart */}
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
                <div className="mb-10">
                  <h3 className="text-2xl font-heading font-bold text-gray-900">Annual Procurement Performance</h3>
                  <p className="text-gray-500 font-medium">Monthly Budget vs Actual Spending for {selectedYear}</p>
                </div>

                <div className="relative h-[400px] w-full mt-10">
                  {/* Y-Axis Grid Lines */}
                  {[0, 25, 50, 75, 100].map(tick => (
                    <div key={tick} className="absolute w-full border-t border-gray-100 text-[10px] font-bold text-gray-300 flex items-end justify-start h-0" style={{ bottom: `${tick}%` }}>
                      <span className="mb-1">{tick}%</span>
                    </div>
                  ))}

                  {/* Bars Implementation */}
                  <div className="absolute inset-0 flex items-end justify-between px-12 group">
                    {allMonths.map(({ month, monthName, budget }) => {
                      const spent = calculateMonthlySpending(month)
                      const maxPossible = Math.max(budget.amount, spent, 1000)
                      const budgetHeight = (budget.amount / maxPossible) * 100
                      const spentHeight = (spent / maxPossible) * 100

                      return (
                        <div key={month} className="flex flex-col items-center group/bar w-[6%] h-full relative">
                          <div className="flex-1 w-full flex items-end justify-center space-x-1">
                            {/* Budget Bar */}
                            <div
                              className="w-1/2 bg-gray-200 rounded-t-[4px] transition-all duration-1000 hover:bg-gray-300"
                              style={{ height: `${budgetHeight}%` }}
                              title={`Budget: ${formatCurrency(budget.amount)}`}
                            ></div>
                            {/* Spent Bar */}
                            <div
                              className={`w-1/2 rounded-t-[4px] transition-all duration-1000 hover:opacity-80 ${spentHeight > budgetHeight && budgetHeight > 0 ? 'bg-red-500' : 'bg-black'}`}
                              style={{ height: `${spentHeight}%` }}
                              title={`Spent: ${formatCurrency(spent)}`}
                            ></div>
                          </div>
                          <span className="mt-4 text-[10px] font-bold text-gray-400 uppercase transform -rotate-45 md:rotate-0 tracking-tighter">
                            {monthName.slice(0, 3)}
                          </span>

                          {/* Hover Tooltip - Simplified */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                            {formatCurrency(spent)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center mt-16 space-x-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Budget</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Actual Spent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Over Budget</span>
                  </div>
                </div>
              </div>

              {/* Insight Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                  <h4 className="font-heading font-bold text-gray-900 mb-6">Efficiency Insights</h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Highest Spent Month</p>
                      <p className="text-sm font-bold text-gray-900">
                        {monthNames[allMonths.sort((a, b) => calculateMonthlySpending(b.month) - calculateMonthlySpending(a.month))[0].month - 1]}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">Savings from Budget</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(Math.max(0, totalAnnualBudget - totalAnnualSpending))}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-black rounded-[40px] p-8 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="font-heading font-bold mb-4">Budget Intelligence</h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      Based on your current spending of {formatCurrency(totalAnnualSpending)}, you are on track to end the year with
                      a <span className="text-white font-bold">{100 - annualPercentage}%</span> budget surplus.
                    </p>
                    <Button variant="ghost" className="text-white border-white/20 hover:bg-white/10 w-full rounded-2xl">
                      View Optimization Guide
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal - Enhanced */}
        {editingMonth && (
          <Modal isOpen={!!editingMonth} onClose={() => setEditingMonth(null)}>
            <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                Edit Budget
              </h2>
              <p className="text-gray-500 font-medium mb-8">Set budget for {monthNames[editingMonth.month - 1]} {selectedYear}</p>

              <div className="space-y-8">
                {/* Current Spending Info */}
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Spending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(calculateMonthlySpending(editingMonth.month))}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Budget Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                    Budget Limit
                  </label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 group-focus-within:text-black transition-colors">$</span>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-6 py-5 bg-gray-50 border-none rounded-3xl text-xl font-bold focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                    Budget Justification
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Reason for this budget allocation..."
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    rows="3"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleSaveBudget}
                    className="w-full py-5 bg-black text-white rounded-[20px] shadow-xl hover:shadow-2xl transition-all font-bold text-lg"
                  >
                    Confirm Changes
                  </Button>
                  <button
                    onClick={() => setEditingMonth(null)}
                    className="w-full py-4 text-gray-400 font-bold text-sm hover:text-gray-900 transition-colors"
                  >
                    Discard and Close
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
