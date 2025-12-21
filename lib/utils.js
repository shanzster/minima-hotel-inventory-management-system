import { CURRENCY } from './constants.js'

// Utility functions - will be expanded in subsequent tasks

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

export function formatCurrency(amount) {
  if (!amount) return `${CURRENCY.SYMBOL}0.00`
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: CURRENCY.CODE
  }).format(amount)
}

export function calculateStockStatus(currentStock, restockThreshold, maxStock) {
  if (currentStock === 0) return 'critical'
  if (currentStock <= restockThreshold) return 'low'
  if (maxStock && currentStock > maxStock) return 'excess'
  return 'normal'
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}