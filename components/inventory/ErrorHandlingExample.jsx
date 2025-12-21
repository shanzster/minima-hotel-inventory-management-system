// Example component demonstrating comprehensive error handling integration
import React, { useState } from 'react'
import ErrorBoundary from '../ui/ErrorBoundary'
import { ErrorDisplay, ValidationErrorDisplay, DataConflictDisplay } from '../ui/ErrorDisplay'
import Input from '../ui/Input'
import { Button } from '../ui/Button'
import { useFormValidation, inventoryValidationRules } from '../../hooks/useFormValidation'
import { useEnhancedApi, EnhancedInventoryAPI } from '../../lib/enhancedApi'
import { useSession } from '../../lib/sessionManager'
import { 
  DataConflictError, 
  ValidationErrors, 
  classifyError, 
  ERROR_TYPES 
} from '../../lib/errorHandling'

// Example form component with comprehensive error handling
function InventoryItemForm({ itemId = null, onSuccess, onCancel }) {
  const { user, isAuthenticated } = useSession()
  const { loading, error, executeRequest, clearError } = useEnhancedApi()
  const [conflictError, setConflictError] = useState(null)

  const initialValues = {
    name: '',
    category: '',
    location: '',
    stockLevel: '',
    restockThreshold: '',
    expirationDate: ''
  }

  const {
    values,
    errors,
    touched,
    hasErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
    submitError,
    reset
  } = useFormValidation(initialValues, {
    name: inventoryValidationRules.itemName,
    category: inventoryValidationRules.category,
    location: inventoryValidationRules.location,
    stockLevel: inventoryValidationRules.stockLevel,
    restockThreshold: inventoryValidationRules.restockThreshold,
    expirationDate: inventoryValidationRules.expirationDate
  })

  // Handle form submission with comprehensive error handling
  const onSubmit = async (formData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required')
    }

    try {
      const result = await executeRequest(async () => {
        if (itemId) {
          return await EnhancedInventoryAPI.updateItem(itemId, formData, {
            expectedVersion: formData.version
          })
        } else {
          return await EnhancedInventoryAPI.createItem(formData)
        }
      })

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      // Handle specific error types
      if (err instanceof DataConflictError) {
        setConflictError(err)
        return // Don't throw, let user resolve conflict
      }

      if (err instanceof ValidationErrors) {
        // Server-side validation errors
        Object.entries(err.errors).forEach(([field, message]) => {
          setFieldError(field, message)
        })
        return
      }

      // Re-throw other errors to be handled by error boundary or display
      throw err
    }
  }

  // Handle data conflict resolution
  const handleConflictResolution = async (resolution) => {
    if (!conflictError) return

    try {
      let result
      
      if (resolution === 'accept_current') {
        // Accept the current server value
        result = await executeRequest(() => 
          EnhancedInventoryAPI.getItem(itemId)
        )
        reset(result)
      } else if (resolution === 'force_update') {
        // Force update with our values
        result = await executeRequest(() =>
          EnhancedInventoryAPI.updateItem(itemId, values, { force: true })
        )
      } else if (resolution === 'refresh') {
        // Refresh and try again
        result = await executeRequest(() => 
          EnhancedInventoryAPI.getItem(itemId)
        )
        reset(result)
      }

      setConflictError(null)
      
      if (onSuccess && result) {
        onSuccess(result)
      }
    } catch (err) {
      // If resolution fails, show the error
      console.error('Conflict resolution failed:', err)
    }
  }

  // Render conflict resolution UI
  if (conflictError) {
    return (
      <div className="p-6">
        <DataConflictDisplay
          expectedValue={conflictError.expectedVersion}
          actualValue={conflictError.actualVersion}
          onAcceptCurrent={() => handleConflictResolution('accept_current')}
          onForceUpdate={() => handleConflictResolution('force_update')}
          onRefresh={() => handleConflictResolution('refresh')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-md border border-gray-300">
      <h2 className="text-xl font-heading font-medium mb-6">
        {itemId ? 'Edit Inventory Item' : 'Add Inventory Item'}
      </h2>

      {/* Network/API errors */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={() => {
            clearError()
            handleSubmit(onSubmit)
          }}
          onDismiss={clearError}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )}

      {/* Form validation errors */}
      {hasErrors && (
        <ValidationErrorDisplay
          errors={errors}
          onDismiss={() => {
            // Clear all errors
            Object.keys(errors).forEach(field => clearFieldError(field))
          }}
        />
      )}

      {/* Submit errors */}
      {submitError && (
        <ErrorDisplay
          error={submitError}
          onRetry={() => handleSubmit(onSubmit)}
          onDismiss={() => {
            // Clear submit error by changing a field
            handleChange('name', values.name)
          }}
        />
      )}

      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(onSubmit)
      }}>
        <div className="space-y-4">
          <Input
            {...getFieldProps('name')}
            label="Item Name"
            placeholder="Enter item name"
            required
          />

          <Input
            {...getFieldProps('category')}
            type="select"
            label="Category"
            placeholder="Select category"
            required
            options={[
              { value: 'toiletries', label: 'Toiletries' },
              { value: 'beverages', label: 'Beverages' },
              { value: 'cleaning-supplies', label: 'Cleaning Supplies' },
              { value: 'kitchen-consumables', label: 'Kitchen Consumables' },
              { value: 'office-supplies', label: 'Office Supplies' }
            ]}
          />

          <Input
            {...getFieldProps('location')}
            label="Location"
            placeholder="Enter storage location"
            required
          />

          <Input
            {...getFieldProps('stockLevel')}
            type="number"
            label="Current Stock Level"
            placeholder="0"
            min="0"
            required
          />

          <Input
            {...getFieldProps('restockThreshold')}
            type="number"
            label="Restock Threshold"
            placeholder="10"
            min="1"
            required
          />

          <Input
            {...getFieldProps('expirationDate')}
            type="date"
            label="Expiration Date (Optional)"
            helpText="Leave blank for non-perishable items"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            variant="primary"
            disabled={loading || hasErrors}
            loading={loading}
          >
            {loading ? 'Saving...' : (itemId ? 'Update Item' : 'Add Item')}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Example page component with error boundary
function InventoryManagementPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const handleFormSuccess = (result) => {
    console.log('Form submitted successfully:', result)
    setShowForm(false)
    setSelectedItem(null)
    // Refresh inventory list, show success message, etc.
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedItem(null)
  }

  return (
    <ErrorBoundary
      name="InventoryManagementPage"
      level="page"
      onError={(error, errorInfo) => {
        console.error('Page-level error:', error, errorInfo)
      }}
    >
      <div className="min-h-screen bg-whitesmoke p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-medium">
              Inventory Management
            </h1>
            
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              Add New Item
            </Button>
          </div>

          {showForm && (
            <ErrorBoundary
              name="InventoryForm"
              level="component"
              onError={(error) => {
                console.error('Form error:', error)
              }}
              onRetry={() => {
                // Reset form state
                setSelectedItem(null)
              }}
            >
              <InventoryItemForm
                itemId={selectedItem?.id}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </ErrorBoundary>
          )}

          {/* Inventory list would go here */}
          <div className="bg-white rounded-md border border-gray-300 p-6">
            <p className="text-gray-500 text-center">
              Inventory list component would be rendered here...
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default InventoryManagementPage
export { InventoryItemForm }