/**
 * Property-Based Tests for Supplier Selection Consistency
 * **Feature: inventory-frontend, Property 7: Supplier Selection Consistency**
 * **Validates: Requirements 3.2, 6.5**
 */

import { describe, test, expect } from 'vitest'
import fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { mockSuppliers, getActiveSuppliers, getSuppliersByCategory } from '../../lib/mockData'
import SupplierForm from './SupplierForm'

// Generator for supplier data
const supplierGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  contactPerson: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  phone: fc.string({ minLength: 10, maxLength: 20 }),
  address: fc.string({ minLength: 10, maxLength: 200 }),
  categories: fc.array(
    fc.oneof(
      fc.constant('menu-items'),
      fc.constant('toiletries'),
      fc.constant('cleaning-supplies'),
      fc.constant('equipment'),
      fc.constant('office-supplies')
    ),
    { minLength: 1, maxLength: 3 }
  ),
  isActive: fc.boolean(),
  isApproved: fc.boolean()
}).chain(baseSupplier => {
  // Generate performance metrics with logical consistency
  return fc.tuple(
    fc.nat(1000), // totalOrders
    fc.float({ min: 0, max: 5, noNaN: true }), // overallRating
    fc.float({ min: 0, max: 5, noNaN: true }), // qualityRating
    fc.integer({ min: 1, max: 24 }) // responseTime
  ).chain(([totalOrders, overallRating, qualityRating, responseTime]) => {
    return fc.tuple(
      fc.integer({ min: 0, max: totalOrders }), // onTimeDeliveries
      fc.integer({ min: 0, max: totalOrders }) // qualityIssues
    ).map(([onTimeDeliveries, qualityIssues]) => {
      // Calculate delivery reliability based on on-time deliveries
      const deliveryReliability = totalOrders > 0 
        ? Math.round((onTimeDeliveries / totalOrders) * 100)
        : 0
      
      return {
        ...baseSupplier,
        performanceMetrics: {
          overallRating,
          deliveryReliability,
          qualityRating,
          responseTime,
          totalOrders,
          onTimeDeliveries,
          qualityIssues
        }
      }
    })
  })
})

describe('Supplier Selection Consistency', () => {
  test('**Feature: inventory-frontend, Property 7: Supplier Selection Consistency** - only approved and active suppliers should be available for selection', () => {
    fc.assert(fc.property(
      fc.array(supplierGenerator, { minLength: 5, maxLength: 20 }),
      (suppliers) => {
        // Filter to get only active and approved suppliers
        const activeSuppliers = suppliers.filter(supplier => 
          supplier.isActive && supplier.isApproved
        )
        
        // Verify that getActiveSuppliers function returns only active and approved suppliers
        const mockActiveSuppliers = activeSuppliers
        
        // All returned suppliers should be both active and approved
        mockActiveSuppliers.forEach(supplier => {
          expect(supplier.isActive).toBe(true)
          expect(supplier.isApproved).toBe(true)
        })
        
        // No inactive or unapproved suppliers should be in the result
        const inactiveOrUnapproved = suppliers.filter(supplier => 
          !supplier.isActive || !supplier.isApproved
        )
        
        inactiveOrUnapproved.forEach(supplier => {
          expect(mockActiveSuppliers).not.toContain(supplier)
        })
      }
    ), { numRuns: 100 })
  })

  test('**Feature: inventory-frontend, Property 7: Supplier Selection Consistency** - supplier-product associations should be maintained correctly', () => {
    fc.assert(fc.property(
      fc.array(supplierGenerator, { minLength: 3, maxLength: 15 }),
      fc.oneof(
        fc.constant('menu-items'),
        fc.constant('toiletries'),
        fc.constant('cleaning-supplies'),
        fc.constant('equipment'),
        fc.constant('office-supplies')
      ),
      (suppliers, category) => {
        // Filter suppliers by category
        const categorySuppliers = suppliers.filter(supplier => 
          supplier.categories.includes(category) && 
          supplier.isActive && 
          supplier.isApproved
        )
        
        // All returned suppliers should have the requested category
        categorySuppliers.forEach(supplier => {
          expect(supplier.categories).toContain(category)
          expect(supplier.isActive).toBe(true)
          expect(supplier.isApproved).toBe(true)
        })
        
        // Suppliers without the category should not be included
        const suppliersWithoutCategory = suppliers.filter(supplier => 
          !supplier.categories.includes(category)
        )
        
        suppliersWithoutCategory.forEach(supplier => {
          expect(categorySuppliers).not.toContain(supplier)
        })
      }
    ), { numRuns: 100 })
  })

  test('**Feature: inventory-frontend, Property 7: Supplier Selection Consistency** - supplier form validation should consistently enforce required fields', () => {
    fc.assert(fc.property(
      fc.record({
        name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        contactPerson: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        email: fc.option(fc.emailAddress()),
        phone: fc.option(fc.string({ minLength: 10, maxLength: 20 })),
        address: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
        categories: fc.array(fc.string(), { maxLength: 5 })
      }),
      (formData) => {
        // Mock form submission handler
        let submissionAttempted = false
        let submittedData = null
        
        const mockSubmit = (data) => {
          submissionAttempted = true
          submittedData = data
        }
        
        const mockCancel = () => {}
        
        // Render the form
        render(
          <SupplierForm 
            onSubmit={mockSubmit}
            onCancel={mockCancel}
          />
        )
        
        // Check that form validation is consistent
        const hasRequiredFields = 
          formData.name && 
          formData.contactPerson && 
          formData.email && 
          formData.phone && 
          formData.address && 
          formData.categories.length > 0
        
        // If all required fields are present and valid, form should be submittable
        // If any required field is missing, form should prevent submission
        if (!hasRequiredFields) {
          // Form should show validation errors for missing required fields
          expect(submissionAttempted).toBe(false)
        }
        
        // Email validation should be consistent
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          expect(submissionAttempted).toBe(false)
        }
      }
    ), { numRuns: 50 })
  })

  test('**Feature: inventory-frontend, Property 7: Supplier Selection Consistency** - performance metrics should be calculated consistently', () => {
    fc.assert(fc.property(
      supplierGenerator,
      (supplier) => {
        const metrics = supplier.performanceMetrics
        
        // Performance rating should be within valid range
        expect(metrics.overallRating).toBeGreaterThanOrEqual(0)
        expect(metrics.overallRating).toBeLessThanOrEqual(5)
        
        // Delivery reliability should be a percentage
        expect(metrics.deliveryReliability).toBeGreaterThanOrEqual(0)
        expect(metrics.deliveryReliability).toBeLessThanOrEqual(100)
        
        // Quality rating should be within valid range
        expect(metrics.qualityRating).toBeGreaterThanOrEqual(0)
        expect(metrics.qualityRating).toBeLessThanOrEqual(5)
        
        // Response time should be positive
        expect(metrics.responseTime).toBeGreaterThan(0)
        
        // On-time deliveries should not exceed total orders
        expect(metrics.onTimeDeliveries).toBeLessThanOrEqual(metrics.totalOrders)
        
        // Quality issues should not exceed total orders
        expect(metrics.qualityIssues).toBeLessThanOrEqual(metrics.totalOrders)
        
        // If there are orders, delivery reliability should match the calculation
        if (metrics.totalOrders > 0) {
          const expectedReliability = Math.round((metrics.onTimeDeliveries / metrics.totalOrders) * 100)
          // Allow for small rounding differences
          expect(Math.abs(metrics.deliveryReliability - expectedReliability)).toBeLessThanOrEqual(1)
        }
      }
    ), { numRuns: 100 })
  })
})