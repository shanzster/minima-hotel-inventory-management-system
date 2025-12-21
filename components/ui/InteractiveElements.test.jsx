import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import fc from 'fast-check'
import Button from './Button'
import Input from './Input'
import Modal from './Modal'

/**
 * Feature: inventory-frontend, Property 10: Interactive Element Consistency
 * Validates: Requirements 8.3
 */
describe('Interactive Elements - Consistency', () => {
  it('should use consistent CSS classes for 200-300ms ease-out transitions', () => {
    fc.assert(fc.property(
      fc.oneof(fc.constant('primary'), fc.constant('secondary'), fc.constant('ghost')),
      fc.oneof(fc.constant('text'), fc.constant('number'), fc.constant('select')),
      fc.boolean(),
      fc.string({ minLength: 1, maxLength: 50 }),
      (buttonVariant, inputType, modalOpen, text) => {
        // Test Button transition classes
        const { container: buttonContainer } = render(
          <Button variant={buttonVariant}>{text}</Button>
        )
        
        const button = buttonContainer.querySelector('button')
        
        // Verify button has consistent transition classes
        expect(button.className).toContain('transition-all')
        expect(button.className).toContain('duration-200') // 200ms
        expect(button.className).toContain('ease-out')
        
        // Test Input transition classes
        const options = inputType === 'select' ? [
          { label: 'Option 1', value: 'opt1' }
        ] : []
        
        const { container: inputContainer } = render(
          <Input 
            type={inputType}
            value=""
            onChange={() => {}}
            options={options}
          />
        )
        
        const input = inputContainer.querySelector(inputType === 'select' ? 'select' : 'input')
        
        // Verify input has consistent transition classes
        expect(input.className).toContain('transition-all')
        expect(input.className).toContain('duration-200') // 200ms
        expect(input.className).toContain('ease-out')
        
        // Test Modal (when open)
        if (modalOpen) {
          const { container: modalContainer } = render(
            <Modal isOpen={true} onClose={() => {}} title={text}>
              Modal content
            </Modal>
          )
          
          // Modal should render with proper structure
          const modal = modalContainer.querySelector('[role="dialog"]')
          expect(modal).toBeTruthy()
          
          // Check that all interactive elements within modal maintain consistency
          const modalButtons = modalContainer.querySelectorAll('button')
          modalButtons.forEach(modalButton => {
            expect(modalButton.className).toContain('transition-all')
            expect(modalButton.className).toContain('duration-200')
            expect(modalButton.className).toContain('ease-out')
          })
        }
      }
    ), { numRuns: 100 })
  })
  
  it('should maintain consistent behavior and styling across all user interactions', () => {
    fc.assert(fc.property(
      fc.boolean(),
      fc.string({ minLength: 1, maxLength: 20 }),
      (disabled, text) => {
        const { container } = render(
          <div>
            <Button disabled={disabled}>{text}</Button>
            <Input value={text} onChange={() => {}} />
          </div>
        )
        
        const button = container.querySelector('button')
        const input = container.querySelector('input')
        
        // Test button interaction consistency
        if (disabled) {
          expect(button.disabled).toBe(true)
          expect(button.className).toContain('disabled:cursor-not-allowed')
        } else {
          expect(button.disabled).toBe(false)
        }
        
        // Verify consistent font usage across interactive elements
        expect(button.className).toContain('font-body')
        expect(input.className).toContain('font-body')
        
        // Verify consistent border-radius usage
        expect(button.className).toContain('rounded-sm') // 6px
        expect(input.className).toContain('rounded-sm') // 6px
        
        // Verify consistent focus behavior classes
        expect(input.className).toContain('focus:outline-none')
        expect(input.className).toContain('focus:border-black')
        
        // Test that all elements use consistent transition timing
        expect(button.className).toContain('transition-all')
        expect(button.className).toContain('duration-200')
        expect(button.className).toContain('ease-out')
        
        expect(input.className).toContain('transition-all')
        expect(input.className).toContain('duration-200')
        expect(input.className).toContain('ease-out')
        
        // Verify content is rendered correctly
        expect(button.textContent).toBe(text)
        expect(input.value).toBe(text)
      }
    ), { numRuns: 100 })
  })
})