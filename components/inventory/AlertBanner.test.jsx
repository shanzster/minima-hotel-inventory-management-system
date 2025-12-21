import { describe, test, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import fc from 'fast-check'
import AlertBanner from './AlertBanner'

describe('AlertBanner', () => {
  // **Feature: inventory-frontend, Property 2: Alert System Responsiveness**
  test('alert banner displays appropriate content and actions for any alert type', () => {
    fc.assert(fc.property(
      fc.record({
        type: fc.oneof(
          fc.constant('low-stock'),
          fc.constant('critical-stock'),
          fc.constant('excess-stock'),
          fc.constant('maintenance-due'),
          fc.constant('audit-required'),
          fc.constant('success'),
          fc.constant('warning'),
          fc.constant('error'),
          fc.constant('info')
        ),
        message: fc.lorem({ maxCount: 10 }).filter(s => s.trim().length > 0),
        items: fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.lorem({ maxCount: 3 }).filter(s => s.trim().length > 0),
            currentStock: fc.option(fc.nat(1000))
          }),
          { maxLength: 10 }
        ),
        dismissible: fc.boolean(),
        hasAction: fc.boolean(),
        hasAcknowledge: fc.boolean()
      }),
      (props) => {
        const { type, message, items, dismissible, hasAction, hasAcknowledge } = props
        
        // Create a fresh container for each test iteration
        const testContainer = document.createElement('div')
        document.body.appendChild(testContainer)
        
        const mockOnAction = hasAction ? () => {} : undefined
        const mockOnAcknowledge = hasAcknowledge ? () => {} : undefined
        
        const { container, getByText, queryByText } = render(
          <AlertBanner
            type={type}
            message={message}
            items={items}
            onAction={mockOnAction}
            onAcknowledge={mockOnAcknowledge}
            dismissible={dismissible}
            actionLabel="Take Action"
          />,
          { container: testContainer }
        )
        
        // Verify component renders without errors
        expect(container.firstChild).toBeTruthy()
        
        // Verify message is displayed using container-scoped query
        const messageElement = container.querySelector('.alert-message')
        expect(messageElement).toBeInTheDocument()
        expect(messageElement.textContent.trim()).toBe(message.trim())
        
        // Verify alert type determines correct styling
        const alertElement = container.querySelector('.alert-banner')
        expect(alertElement).toBeInTheDocument()
        
        // Verify appropriate title is shown based on type
        const expectedTitles = {
          'low-stock': 'Low Stock Alert',
          'critical-stock': 'Critical Stock Alert',
          'excess-stock': 'Excess Stock Alert',
          'maintenance-due': 'Maintenance Due',
          'audit-required': 'Audit Required',
          'success': 'Success',
          'warning': 'Warning',
          'error': 'Error',
          'info': 'Information'
        }
        
        expect(getByText(expectedTitles[type])).toBeInTheDocument()
        
        // Verify items count badge when items are present
        if (items.length > 0) {
          const itemsText = items.length === 1 ? '1 item' : `${items.length} items`
          expect(getByText(itemsText)).toBeInTheDocument()
        }
        
        // Verify individual items are shown (up to 5)
        if (items.length > 0) {
          const itemsList = container.querySelector('.alert-items ul')
          expect(itemsList).toBeInTheDocument()
          
          const listItems = itemsList.querySelectorAll('li')
          const expectedItemCount = items.length > 5 ? 6 : items.length // 5 items + 1 "more items" line
          expect(listItems.length).toBe(expectedItemCount)
          
          items.slice(0, 5).forEach((item, index) => {
            const listItem = listItems[index]
            expect(listItem.textContent).toContain(item.name.trim())
            
            if (item.currentStock !== undefined && item.currentStock !== null) {
              expect(listItem.textContent).toContain(`Stock: ${item.currentStock}`)
            }
          })
        }
        
        // Verify "and X more items" text for large item lists
        if (items.length > 5) {
          const moreItemsText = `...and ${items.length - 5} more items`
          const moreItemsElement = container.querySelector('li.text-gray-600.italic')
          expect(moreItemsElement).toBeInTheDocument()
          expect(moreItemsElement.textContent).toBe(moreItemsText)
        }
        
        // Verify action button is present when onAction is provided
        if (hasAction) {
          expect(getByText('Take Action')).toBeInTheDocument()
        } else {
          expect(queryByText('Take Action')).not.toBeInTheDocument()
        }
        
        // Verify acknowledge/dismiss button behavior
        if (hasAcknowledge || dismissible) {
          const buttonText = hasAcknowledge ? 'Acknowledge' : 'Dismiss'
          expect(getByText(buttonText)).toBeInTheDocument()
        }
        
        // Verify appropriate icon is displayed (SVG icons, not emojis)
        const iconElement = container.querySelector('svg')
        expect(iconElement).toBeInTheDocument()
        expect(iconElement).toHaveClass('w-4', 'h-4', 'text-gray-700')
        
        // Clean up the test container
        document.body.removeChild(testContainer)
      }
    ), { numRuns: 100 })
  })
  
  test('alert banner handles dismissal correctly', () => {
    let dismissed = false
    const mockOnAcknowledge = () => { dismissed = true }
    
    const { getByText, container } = render(
      <AlertBanner
        type="info"
        message="Test message"
        onAcknowledge={mockOnAcknowledge}
        dismissible={true}
      />
    )
    
    // Verify alert is initially visible
    expect(getByText('Test message')).toBeInTheDocument()
    
    // Click acknowledge button
    fireEvent.click(getByText('Acknowledge'))
    
    // Verify callback was called
    expect(dismissed).toBe(true)
  })
  
  test('alert banner handles action button correctly', () => {
    let actionCalled = false
    const mockOnAction = () => { actionCalled = true }
    
    const { getByText } = render(
      <AlertBanner
        type="critical-stock"
        message="Critical stock alert"
        onAction={mockOnAction}
        actionLabel="Restock Now"
      />
    )
    
    // Click action button
    fireEvent.click(getByText('Restock Now'))
    
    // Verify callback was called
    expect(actionCalled).toBe(true)
  })
  
  test('alert banner displays correct styling for different alert types', () => {
    const alertTypes = [
      'low-stock', 'critical-stock', 'excess-stock', 
      'maintenance-due', 'audit-required', 'success', 
      'warning', 'error', 'info'
    ]
    
    alertTypes.forEach(type => {
      const { container } = render(
        <AlertBanner type={type} message={`Test ${type} message`} />
      )
      
      const alertElement = container.querySelector('.alert-banner')
      expect(alertElement).toBeInTheDocument()
      
      // Verify border-left styling is applied (all alert types should have border-l-4)
      expect(alertElement.className).toContain('border-l-4')
    })
  })
})