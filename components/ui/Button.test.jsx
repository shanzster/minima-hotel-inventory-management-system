import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import fc from 'fast-check'
import Button from './Button'

/**
 * Feature: inventory-frontend, Property 9: Design System Compliance
 * Validates: Requirements 8.1, 8.2, 8.4, 8.5
 */
describe('Button - Design System Compliance', () => {
  it('should use only approved CSS classes and maintain design system standards', () => {
    fc.assert(fc.property(
      fc.oneof(fc.constant('primary'), fc.constant('secondary'), fc.constant('ghost')),
      fc.oneof(fc.constant('sm'), fc.constant('md'), fc.constant('lg')),
      fc.boolean(),
      fc.string({ minLength: 1, maxLength: 50 }),
      (variant, size, disabled, text) => {
        const { container } = render(
          <Button variant={variant} size={size} disabled={disabled}>
            {text}
          </Button>
        )
        
        const button = container.querySelector('button')
        expect(button).toBeTruthy()
        
        // Check that button has correct CSS classes for design system compliance
        expect(button.className).toContain('font-body') // Uses Roboto font family
        expect(button.className).toContain('rounded-sm') // Uses 6px border-radius
        expect(button.className).toContain('transition-all') // Has transitions
        expect(button.className).toContain('duration-200') // 200ms duration
        expect(button.className).toContain('ease-out') // Ease-out timing
        
        // Check variant-specific classes use approved colors
        if (variant === 'primary') {
          expect(button.className).toContain('bg-black')
          expect(button.className).toContain('text-white')
        } else if (variant === 'secondary') {
          expect(button.className).toContain('bg-white')
          expect(button.className).toContain('text-black')
          expect(button.className).toContain('border-gray-300')
        } else if (variant === 'ghost') {
          expect(button.className).toContain('bg-transparent')
          expect(button.className).toContain('text-black')
        }
        
        // Check size classes follow 8px grid spacing
        if (size === 'sm') {
          expect(button.className).toContain('px-4')
          expect(button.className).toContain('py-2')
        } else if (size === 'md') {
          expect(button.className).toContain('px-5')
          expect(button.className).toContain('py-3')
        } else if (size === 'lg') {
          expect(button.className).toContain('px-6')
          expect(button.className).toContain('py-4')
        }
        
        // Check disabled state
        if (disabled) {
          expect(button.disabled).toBe(true)
          expect(button.className).toContain('disabled:cursor-not-allowed')
        }
        
        // Verify button type is set correctly
        expect(button.type).toBe('button')
      }
    ), { numRuns: 100 })
  })
})