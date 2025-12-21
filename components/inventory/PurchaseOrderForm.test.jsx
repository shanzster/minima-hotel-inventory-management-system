import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import PurchaseOrderForm from './PurchaseOrderForm'

// Mock data for testing
const mockAvailableItems = [
  {
    id: 'item-001',
    name: 'Test Item 1',
    unit: 'kg'
  },
  {
    id: 'item-002', 
    name: 'Test Item 2',
    unit: 'pieces'
  }
]

describe('PurchaseOrderForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form elements correctly', () => {
    render(
      <PurchaseOrderForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        availableItems={mockAvailableItems}
      />
    )

    expect(screen.getByText('Supplier *')).toBeInTheDocument()
    expect(screen.getByText('Add Items')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('Expected Delivery Date *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Purchase Order' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    render(
      <PurchaseOrderForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        availableItems={mockAvailableItems}
      />
    )

    // Try to submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: 'Create Purchase Order' }))

    await waitFor(() => {
      expect(screen.getByText('Please select a supplier')).toBeInTheDocument()
      expect(screen.getByText('Please add at least one item to the purchase order')).toBeInTheDocument()
      expect(screen.getByText('Please select an expected delivery date')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('allows selecting a supplier', async () => {
    render(
      <PurchaseOrderForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        availableItems={mockAvailableItems}
      />
    )

    // Select supplier
    const supplierSelect = screen.getByDisplayValue('Select a supplier...')
    fireEvent.change(supplierSelect, { target: { value: 'supplier-001' } })

    await waitFor(() => {
      expect(screen.getByText('Supplier Details')).toBeInTheDocument()
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('john@coffeeroasters.com')).toBeInTheDocument()
    })
  })

  it('shows error when trying to add item without required fields', async () => {
    render(
      <PurchaseOrderForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        availableItems={mockAvailableItems}
      />
    )

    // Try to add item without filling fields
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }))

    await waitFor(() => {
      expect(screen.getByText('Please select an item and enter quantity and unit cost')).toBeInTheDocument()
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <PurchaseOrderForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        availableItems={mockAvailableItems}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('validates form submission with valid data', async () => {
    render(
      <PurchaseOrderForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        availableItems={mockAvailableItems}
      />
    )

    // Select supplier
    const supplierSelect = screen.getByDisplayValue('Select a supplier...')
    fireEvent.change(supplierSelect, { target: { value: 'supplier-001' } })

    // Add an item
    const itemSelect = screen.getByDisplayValue('Select item...')
    fireEvent.change(itemSelect, { target: { value: 'item-001' } })

    const quantityInputs = screen.getAllByPlaceholderText('0')
    const costInputs = screen.getAllByPlaceholderText('0.00')
    
    fireEvent.change(quantityInputs[0], { target: { value: '10' } })
    fireEvent.change(costInputs[0], { target: { value: '25.50' } })
    
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }))

    // Set future delivery date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    // Find date input by type attribute
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: futureDate } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Purchase Order' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })
  })
})