import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import fc from 'fast-check'
import Modal from './Modal'

/**
 * Feature: inventory-frontend, Property 9: Design System Compliance
 * Validates: Requirements 8.1, 8.2, 8.4, 8.5
 */
describe('Modal - Design System Compliance', () => {
  it('should use approved CSS classes and maintain proper design system standards', () => {
    fc.assert(fc.property(
      fc.boolean(),
      fc.oneof(fc.constant('sm'), fc.constant('md'), fc.constant('lg')),
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 200 }),
      (isOpen, size, title, content) => {
        const { container } = render(
          <Modal 
            isOpen={isOpen}
            onClose={() => {}}
            title={title}
            size={size}
          >
            {content}
          </Modal>
        )
        
        if (!isOpen) {
          // Modal should not render when closed
          expect(container.firstChild).toBeNull()
          return
        }
        
        const modal = container.querySelector('[role="dialog"]')
        expect(modal).toBeTruthy()
        
        // Check that modal has correct CSS classes for design system compliance
        expect(modal.className).toContain('bg-white') // Uses white background
        expect(modal.className).toContain('rounded-md') // Uses 8px border-radius
        expect(modal.className).toContain('shadow-lg') // Has subtle shadow
        
        // Check size classes
        if (size === 'sm') {
          expect(modal.className).toContain('max-w-md')
        } else if (size === 'md') {
          expect(modal.className).toContain('max-w-lg')
        } else if (size === 'lg') {
          expect(modal.className).toContain('max-w-2xl')
        }
        
        // Check modal overlay
        const overlay = container.querySelector('.fixed.inset-0')
        expect(overlay).toBeTruthy()
        expect(overlay.className).toContain('z-50') // Proper z-index
        expect(overlay.className).toContain('flex')
        expect(overlay.className).toContain('items-start')
        expect(overlay.className).toContain('justify-center')
        
        // Check modal title styling (if present)
        const titleElement = container.querySelector('#modal-title')
        if (titleElement) {
          expect(titleElement.className).toContain('font-heading') // Uses Poppins font
          expect(titleElement.className).toContain('font-medium') // 500 weight
          expect(titleElement.className).toContain('text-black') // Black text
        }
        
        // Check header border (if title present)
        const header = container.querySelector('.border-b')
        if (header && title) {
          expect(header.className).toContain('border-gray-300') // Uses approved gray
          expect(header.className).toContain('p-6') // Proper padding (24px)
        }
        
        // Check content padding
        const contentDiv = container.querySelector('.p-6')
        expect(contentDiv).toBeTruthy()
        expect(contentDiv.className).toContain('p-6') // 24px padding (3 * 8px grid)
        
        // Check close button
        const closeButton = container.querySelector('button[aria-label="Close modal"]')
        if (closeButton) {
          expect(closeButton.className).toContain('hover:bg-gray-100') // Subtle hover state
        }
        
        // Verify modal accessibility attributes
        expect(modal.getAttribute('role')).toBe('dialog')
        expect(modal.getAttribute('aria-modal')).toBe('true')
        if (title) {
          expect(modal.getAttribute('aria-labelledby')).toBe('modal-title')
        }
      }
    ), { numRuns: 100 })
  })
})