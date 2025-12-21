import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import fc from 'fast-check'
import Input from './Input'

/**
 * Feature: inventory-frontend, Property 9: Design System Compliance
 * Validates: Requirements 8.1, 8.2, 8.4, 8.5
 */
describe('Input - Design System Compliance', () => {
  it('should use approved CSS classes and maintain 8px grid spacing', () => {
    fc.assert(fc.property(
      fc.oneof(fc.constant('text'), fc.constant('number'), fc.constant('date'), fc.constant('select')),
      fc.string({ minLength: 0, maxLength: 100 }),
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.boolean(),
      (type, value, placeholder, required) => {
        const options = type === 'select' ? [
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' }
        ] : []
        
        const { container } = render(
          <Input 
            type={type}
            value={value}
            onChange={() => {}}
            placeholder={placeholder}
            required={required}
            options={options}
          />
        )
        
        const input = container.querySelector(type === 'select' ? 'select' : 'input')
        expect(input).toBeTruthy()
        
        // Check that input has correct CSS classes for design system compliance
        expect(input.className).toContain('font-body') // Uses Roboto font family
        expect(input.className).toContain('border') // Has border
        expect(input.className).toContain('border-gray-300') // Uses approved gray color
        expect(input.className).toContain('rounded-sm') // Uses 6px border-radius
        expect(input.className).toContain('px-3') // Horizontal padding (12px)
        expect(input.className).toContain('py-2') // Vertical padding (8px)
        expect(input.className).toContain('focus:outline-none') // No outline on focus
        expect(input.className).toContain('focus:border-black') // Black border on focus
        expect(input.className).toContain('transition-all') // Has transitions
        expect(input.className).toContain('duration-200') // 200ms duration
        expect(input.className).toContain('ease-out') // Ease-out timing
        expect(input.className).toContain('w-full') // Full width
        
        // Check required attribute
        if (required) {
          expect(input.required).toBe(true)
        }
        
        // Check type-specific behavior
        if (type === 'select') {
          expect(input.tagName.toLowerCase()).toBe('select')
          // Should have placeholder option
          const placeholderOption = input.querySelector('option[disabled]')
          expect(placeholderOption).toBeTruthy()
        } else {
          expect(input.tagName.toLowerCase()).toBe('input')
          expect(input.type).toBe(type)
        }
        
        // Check error state styling when error is present
        const { container: errorContainer } = render(
          <Input 
            type={type}
            value={value}
            onChange={() => {}}
            error="Test error"
            touched={true}
            options={options}
          />
        )
        
        const errorInput = errorContainer.querySelector(type === 'select' ? 'select' : 'input')
        if (errorInput) {
          expect(errorInput.className).toContain('border-red-500')
          expect(errorInput.className).toContain('focus:border-red-600')
        }
      }
    ), { numRuns: 100 })
  })
})