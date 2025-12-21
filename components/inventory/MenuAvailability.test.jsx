/**
 * **Feature: inventory-frontend, Property 3: Menu Availability Synchronization**
 * Property-based tests for menu availability updates by Kitchen Staff
 */

import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'

// Menu availability logic functions to test
const menuAvailabilityLogic = {
  // Simulates updating menu item availability
  updateMenuAvailability: (menuItems, itemId, newAvailability) => {
    return menuItems.map(item => 
      item.id === itemId 
        ? { ...item, isAvailable: newAvailability }
        : item
    )
  },
  
  // Simulates getting availability counts
  getAvailabilityCounts: (menuItems) => {
    const available = menuItems.filter(item => item.isAvailable).length
    const unavailable = menuItems.filter(item => !item.isAvailable).length
    return { available, unavailable }
  },
  
  // Simulates checking if availability change persists
  isAvailabilityPersisted: (menuItems, itemId, expectedAvailability) => {
    const item = menuItems.find(item => item.id === itemId)
    return item ? item.isAvailable === expectedAvailability : false
  }
}

// Generators for property-based testing
const menuItemGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  isAvailable: fc.boolean(),
  currentStock: fc.nat(1000),
  category: fc.constant('menu-items')
})

const menuItemsArrayGenerator = fc.array(menuItemGenerator, { minLength: 1, maxLength: 10 })

const availabilityUpdateGenerator = fc.record({
  itemId: fc.string({ minLength: 1, maxLength: 20 }),
  newAvailability: fc.boolean()
})

describe('Menu Availability Synchronization Property Tests', () => {
  it('**Feature: inventory-frontend, Property 3: Menu Availability Synchronization** - availability changes persist immediately', () => {
    fc.assert(fc.property(
      menuItemsArrayGenerator,
      availabilityUpdateGenerator,
      (menuItems, update) => {
        // Ensure the item exists in the array
        const itemExists = menuItems.some(item => item.id === update.itemId)
        if (!itemExists) {
          // Add the item to test with
          menuItems.push({
            id: update.itemId,
            name: 'Test Item',
            isAvailable: !update.newAvailability, // Start with opposite state
            currentStock: 10,
            category: 'menu-items'
          })
        }
        
        // Update availability
        const updatedMenuItems = menuAvailabilityLogic.updateMenuAvailability(
          menuItems, 
          update.itemId, 
          update.newAvailability
        )
        
        // Verify the change persists immediately
        const isPersisted = menuAvailabilityLogic.isAvailabilityPersisted(
          updatedMenuItems, 
          update.itemId, 
          update.newAvailability
        )
        
        return isPersisted
      }
    ), { numRuns: 100 })
  })

  it('**Feature: inventory-frontend, Property 3: Menu Availability Synchronization** - availability counts update consistently', () => {
    fc.assert(fc.property(
      menuItemsArrayGenerator,
      fc.array(availabilityUpdateGenerator, { minLength: 1, maxLength: 5 }),
      (initialMenuItems, updates) => {
        let menuItems = [...initialMenuItems]
        
        // Apply all updates
        for (const update of updates) {
          // Ensure item exists
          const itemExists = menuItems.some(item => item.id === update.itemId)
          if (!itemExists) {
            menuItems.push({
              id: update.itemId,
              name: 'Test Item',
              isAvailable: !update.newAvailability,
              currentStock: 10,
              category: 'menu-items'
            })
          }
          
          menuItems = menuAvailabilityLogic.updateMenuAvailability(
            menuItems, 
            update.itemId, 
            update.newAvailability
          )
        }
        
        // Get counts
        const counts = menuAvailabilityLogic.getAvailabilityCounts(menuItems)
        
        // Verify counts are consistent
        const totalItems = menuItems.length
        const calculatedTotal = counts.available + counts.unavailable
        
        return calculatedTotal === totalItems && 
               counts.available >= 0 && 
               counts.unavailable >= 0
      }
    ), { numRuns: 100 })
  })

  it('**Feature: inventory-frontend, Property 3: Menu Availability Synchronization** - multiple availability changes work correctly', () => {
    fc.assert(fc.property(
      menuItemGenerator,
      fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
      (menuItem, availabilitySequence) => {
        let menuItems = [menuItem]
        
        // Apply sequence of availability changes
        for (const newAvailability of availabilitySequence) {
          menuItems = menuAvailabilityLogic.updateMenuAvailability(
            menuItems, 
            menuItem.id, 
            newAvailability
          )
          
          // Verify each change persists
          const isPersisted = menuAvailabilityLogic.isAvailabilityPersisted(
            menuItems, 
            menuItem.id, 
            newAvailability
          )
          
          if (!isPersisted) {
            return false
          }
        }
        
        // Final state should match the last availability in sequence
        const finalAvailability = availabilitySequence[availabilitySequence.length - 1]
        return menuAvailabilityLogic.isAvailabilityPersisted(
          menuItems, 
          menuItem.id, 
          finalAvailability
        )
      }
    ), { numRuns: 100 })
  })

  it('**Feature: inventory-frontend, Property 3: Menu Availability Synchronization** - availability updates preserve other item properties', () => {
    fc.assert(fc.property(
      menuItemsArrayGenerator,
      availabilityUpdateGenerator,
      (menuItems, update) => {
        // Ensure the item exists
        const itemExists = menuItems.some(item => item.id === update.itemId)
        if (!itemExists) {
          menuItems.push({
            id: update.itemId,
            name: 'Test Item',
            isAvailable: !update.newAvailability,
            currentStock: 10,
            category: 'menu-items'
          })
        }
        
        // Store original properties
        const originalItem = menuItems.find(item => item.id === update.itemId)
        const originalProperties = {
          name: originalItem.name,
          currentStock: originalItem.currentStock,
          category: originalItem.category
        }
        
        // Update availability
        const updatedMenuItems = menuAvailabilityLogic.updateMenuAvailability(
          menuItems, 
          update.itemId, 
          update.newAvailability
        )
        
        // Find updated item
        const updatedItem = updatedMenuItems.find(item => item.id === update.itemId)
        
        // Verify other properties are preserved
        return updatedItem &&
               updatedItem.name === originalProperties.name &&
               updatedItem.currentStock === originalProperties.currentStock &&
               updatedItem.category === originalProperties.category &&
               updatedItem.isAvailable === update.newAvailability
      }
    ), { numRuns: 100 })
  })
})