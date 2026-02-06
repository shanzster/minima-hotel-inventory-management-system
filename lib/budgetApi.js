import firebaseDB from './firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore'

const db = firebaseDB.db

const BUDGETS_COLLECTION = 'budgets'

class BudgetApi {
  constructor() {
    console.log('🔥 Budget Firebase Status: Connected')
  }

  /**
   * Get budget for a specific month
   * @param {number} year - Year (e.g., 2024)
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Budget data
   */
  async getBudgetByMonth(year, month) {
    try {
      const budgetRef = doc(db, BUDGETS_COLLECTION, `${year}-${String(month).padStart(2, '0')}`)
      const docSnap = await getDoc(budgetRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      // Return empty budget if doesn't exist
      return {
        id: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month,
        amount: 0,
        spent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
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
    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`
      const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId)
      
      const budgetData = {
        year,
        month,
        amount: Number(amount),
        notes,
        updatedAt: Timestamp.now(),
        updatedBy: 'inventory-controller'
      }

      // Check if budget exists
      const docSnap = await getDoc(budgetRef)
      if (!docSnap.exists()) {
        budgetData.createdAt = Timestamp.now()
        budgetData.spent = 0
      }

      await setDoc(budgetRef, budgetData, { merge: true })
      
      return {
        id: budgetId,
        ...budgetData,
        createdAt: budgetData.createdAt || new Date(),
        updatedAt: new Date()
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
    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`
      const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId)
      
      await updateDoc(budgetRef, {
        spent: Number(spent),
        updatedAt: Timestamp.now()
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
    try {
      const q = query(
        collection(db, BUDGETS_COLLECTION),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
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
    try {
      const q = query(
        collection(db, BUDGETS_COLLECTION),
        where('year', '==', year),
        orderBy('month', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
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
    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`
      await deleteDoc(doc(db, BUDGETS_COLLECTION, budgetId))
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
    return Math.max(0, budget.amount - (budget.spent || 0))
  }

  /**
   * Calculate budget percentage used
   * @param {Object} budget - Budget object
   * @returns {number} Percentage used (0-100)
   */
  calculatePercentageUsed(budget) {
    if (budget.amount === 0) return 0
    return Math.round((budget.spent || 0) / budget.amount * 100)
  }
}

export default new BudgetApi()
