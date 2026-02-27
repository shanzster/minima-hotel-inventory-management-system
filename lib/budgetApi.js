import firebaseDB, { database } from './firebase'

const BUDGETS_PATH = 'budgets'
const useFirebase = database !== null

class BudgetApi {
  constructor() {
    if (typeof window !== 'undefined') {
      console.log('🔥 Budget API Status:', useFirebase ? 'Connected' : 'Using mock data')
    }
  }

  /**
   * Get budget for a specific month
   * @param {number} year - Year (e.g., 2024)
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Budget data
   */
  async getBudgetByMonth(year, month) {
    if (!useFirebase) {
      return {
        id: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month,
        amount: 0,
        spent: 0,
        notes: ''
      }
    }

    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`
      const budget = await firebaseDB.readById(BUDGETS_PATH, budgetId)

      if (budget) {
        return budget
      }

      // Return empty budget if doesn't exist
      return {
        id: budgetId,
        year,
        month,
        amount: 0,
        spent: 0,
        notes: ''
      }
    } catch (error) {
      console.error('Error fetching budget:', error)
      throw error
    }
  }

  /**
   * Get current month budget
   * @returns {Promise<Object>} Current month budget
   */
  async getCurrentMonthBudget() {
    const now = new Date()
    return this.getBudgetByMonth(now.getFullYear(), now.getMonth() + 1)
  }

  /**
   * Set budget for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} amount - Budget amount
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Created/updated budget
   */
  async setBudget(year, month, amount, notes = '') {
    const budgetId = `${year}-${String(month).padStart(2, '0')}`

    if (!useFirebase) {
      return { id: budgetId, year, month, amount, notes }
    }

    try {
      const budgetData = {
        year,
        month,
        amount: Number(amount),
        notes,
        updatedAt: new Date().toISOString(),
        updatedBy: 'inventory-controller'
      }

      // Check if budget exists to preserve createdAt and spent
      const existing = await this.getBudgetByMonth(year, month)
      if (!existing.createdAt) {
        budgetData.createdAt = new Date().toISOString()
        budgetData.spent = existing.spent || 0
      } else {
        budgetData.createdAt = existing.createdAt
        budgetData.spent = existing.spent || 0
      }

      await firebaseDB.update(BUDGETS_PATH, budgetId, budgetData)

      return {
        id: budgetId,
        ...budgetData
      }
    } catch (error) {
      console.error('Error setting budget:', error)
      throw error
    }
  }

  /**
   * Update spent amount for a budget
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} spent - Amount spent
   * @returns {Promise<void>}
   */
  async updateBudgetSpent(year, month, spent) {
    if (!useFirebase) return

    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`
      await firebaseDB.update(BUDGETS_PATH, budgetId, {
        spent: Number(spent),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating budget spent:', error)
      throw error
    }
  }

  /**
   * Get all budgets
   * @returns {Promise<Array>} All budgets
   */
  async getAllBudgets() {
    if (!useFirebase) return []

    try {
      const budgets = await firebaseDB.read(BUDGETS_PATH)
      if (!budgets) return []

      // RTDB read returns array via firebaseDB helper
      return budgets.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
    } catch (error) {
      console.error('Error fetching all budgets:', error)
      throw error
    }
  }

  /**
   * Get budgets for a specific year
   * @param {number} year - Year
   * @returns {Promise<Array>} Budgets for the year
   */
  async getBudgetsByYear(year) {
    if (!useFirebase) return []

    try {
      const allBudgets = await this.getAllBudgets()
      return allBudgets.filter(b => b.year === year)
    } catch (error) {
      console.error('Error fetching budgets by year:', error)
      throw error
    }
  }

  /**
   * Delete a budget
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<void>}
   */
  async deleteBudget(year, month) {
    if (!useFirebase) return

    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`
      await firebaseDB.delete(BUDGETS_PATH, budgetId)
    } catch (error) {
      console.error('Error deleting budget:', error)
      throw error
    }
  }

  /**
   * Calculate budget remaining
   * @param {Object} budget - Budget object
   * @returns {number} Remaining budget
   */
  calculateRemaining(budget) {
    return Math.max(0, (budget.amount || 0) - (budget.spent || 0))
  }

  /**
   * Calculate budget percentage used
   * @param {Object} budget - Budget object
   * @returns {number} Percentage used (0-100)
   */
  calculatePercentageUsed(budget) {
    if (!budget.amount || budget.amount === 0) return 0
    return Math.round((budget.spent || 0) / budget.amount * 100)
  }
}

export default new BudgetApi()
