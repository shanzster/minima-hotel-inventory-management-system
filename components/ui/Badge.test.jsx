import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import fc from 'fast-check'
import Badge from './Badge'

/**
 * Feature: inventory-frontend, Property 9: Design System Compliance
 * Validates: Requirements 8.1, 8.2, 8.4, 8.5
 */
describe('Badge - Design System Compliance', () => {
  it('should use only approved CSS classes and maintain design system standards', () => {
    const approvedVariants = [
      'default', 'pending', 'approved', 'in-transit', 'delivered', 'cancelled',
      'normal', 'low', 'critical', 'excess', 'excellent', 'good', 'fair', 'poor'
    ]
    
    fc.assert(fc.property(
      fc.constantFrom(...approvedVariants),
      fc.string({ minLength: 1, maxLength: 50 }),
      (variant, text) => {
        const { container } = render(
          <Badge variant={variant}>
            {text}
          </Badge>
        )
        
        const badge = container.querySelector('span')
        expect(badge).toBeTruthy()
        
        // Check that badge has correct CSS classes for design system compliance
        expect(badge.className).toContain('inline-flex') // Proper display
        expect(badge.className).toContain('items-center') // Vertical alignment
        expect(badge.className).toContain('px-2') // Horizontal padding (8px)
        expect(badge.className).toContain('py-1') // Vertical padding (4px)
        expect(badge.className).toContain('rounded-sm') // 6px border-radius
        expect(badge.className).toContain('text-xs') // Small text size
        expect(badge.className).toContain('font-body') // Uses Roboto font
        expect(badge.className).toContain('border') // Has border
        expect(badge.className).toContain('transition-all') // Has transitions
        expect(badge.className).toContain('duration-200') // 200ms duration
        expect(badge.className).toContain('ease-out') // Ease-out timing
        
        // Check that badge uses approved color combinations
        const approvedBackgroundClasses = [
          'bg-gray-100', 'bg-accent-sand', 'bg-white'
        ]
        const approvedTextClasses = [
          'text-gray-700', 'text-black', 'text-gray-500'
        ]
        const approvedBorderClasses = [
          'border-gray-300'
        ]
        
        // At least one approved background class should be present
        const hasApprovedBackground = approvedBackgroundClasses.some(cls => 
          badge.className.includes(cls)
        )
        expect(hasApprovedBackground).toBe(true)
        
        // At least one approved text class should be present
        const hasApprovedText = approvedTextClasses.some(cls => 
          badge.className.includes(cls)
        )
        expect(hasApprovedText).toBe(true)
        
        // Should use approved border color
        const hasApprovedBorder = approvedBorderClasses.some(cls => 
          badge.className.includes(cls)
        )
        expect(hasApprovedBorder).toBe(true)
        
        // Verify content is rendered
        expect(badge.textContent).toBe(text)
      }
    ), { numRuns: 100 })
  })
})