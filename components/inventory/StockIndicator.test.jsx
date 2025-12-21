import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'
import StockIndicator from './StockIndicator'

describe('StockIndicator', () => {
  // **Feature: inventory-frontend, Property 1: Stock Level Display Consistency**
  test('stock indicator displays correct state for any stock level', () => {
    fc.assert(fc.property(
      fc.record({
        currentStock: fc.nat(1000),
        restockThreshold: fc.nat({ min: 1, max: 100 }),
        maxStock: fc.option(fc.nat({ min: 101, max: 1000 })),
        showLabel: fc.boolean(),
        showBar: fc.boolean()
      }),
      (props) => {
        const { currentStock, restockThreshold, maxStock, showLabel, showBar } = props
        
        // Create a fresh container for each test iteration
        const testContainer = document.createElement('div')
        document.body.appendChild(testContainer)
        
        const { container, getByText } = render(
          <StockIndicator
            currentStock={currentStock}
            restockThreshold={restockThreshold}
            maxStock={maxStock}
            showLabel={showLabel}
            showBar={showBar}
          />,
          { container: testContainer }
        )
        
        // Verify component renders without errors
        expect(container.firstChild).toBeTruthy()
        
        // Determine expected status based on stock levels
        let expectedStatus
        if (currentStock === 0) {
          expectedStatus = 'critical'
        } else if (currentStock <= restockThreshold) {
          expectedStatus = 'low'
        } else if (maxStock && currentStock > maxStock) {
          expectedStatus = 'excess'
        } else {
          expectedStatus = 'normal'
        }
        
        // Verify correct status badge is displayed
        const statusTexts = {
          'critical': 'Critical',
          'low': 'Low Stock',
          'excess': 'Excess',
          'normal': 'Normal'
        }
        
        // Use container-scoped queries to avoid conflicts
        expect(getByText(statusTexts[expectedStatus])).toBeInTheDocument()
        
        // Verify stock label is shown when requested
        if (showLabel) {
          // Look for the stock label container instead of just the number
          const stockLabelElement = container.querySelector('.stock-label')
          expect(stockLabelElement).toBeInTheDocument()
          expect(stockLabelElement.textContent).toContain(currentStock.toString())
          
          if (restockThreshold > 0) {
            expect(stockLabelElement.textContent).toContain(`${restockThreshold} min`)
          }
        }
        
        // Verify stock bar is shown when requested
        if (showBar) {
          const stockBar = container.querySelector('.stock-bar')
          expect(stockBar).toBeInTheDocument()
          
          const stockFill = container.querySelector('.stock-fill')
          expect(stockFill).toBeInTheDocument()
          
          // Verify bar has appropriate color based on status
          const expectedColors = {
            'critical': 'bg-gray-700',
            'low': 'bg-gray-500',
            'excess': 'bg-gray-500',
            'normal': 'bg-gray-900'
          }
          
          expect(stockFill).toHaveClass(expectedColors[expectedStatus])
        }
        
        // Clean up the test container
        document.body.removeChild(testContainer)
      }
    ), { numRuns: 100 })
  })
  
  test('stock indicator handles edge cases correctly', () => {
    // Test zero stock
    const { getByText: getByText1 } = render(<StockIndicator currentStock={0} restockThreshold={10} />)
    expect(getByText1('Critical')).toBeInTheDocument()
    
    // Test exact threshold
    const { getByText: getByText2 } = render(<StockIndicator currentStock={10} restockThreshold={10} />)
    expect(getByText2('Low Stock')).toBeInTheDocument()
    
    // Test excess stock
    const { getByText: getByText3 } = render(<StockIndicator currentStock={150} restockThreshold={10} maxStock={100} />)
    expect(getByText3('Excess')).toBeInTheDocument()
    
    // Test normal stock
    const { getByText: getByText4 } = render(<StockIndicator currentStock={50} restockThreshold={10} maxStock={100} />)
    expect(getByText4('Normal')).toBeInTheDocument()
  })
})