'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import inventoryApi from '../../lib/inventoryApi'

export default function AddMenuItemForm({ onSubmit, onCancel, isLoading = false }) {
  const [availableItems, setAvailableItems] = useState([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [formData, setFormData] = useState({
    inventoryItemId: '',
    name: '',
    description: '',
    category: 'main-course',
    preparationTime: 20,
    requiredIngredients: []
  })
  const [selectedItem, setSelectedItem] = useState('')
  const [errors, setErrors] = useState({})

  // Load available inventory items for menu creation
  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoadingItems(true)
        const items = await inventoryApi.getAll()
        // Filter to only show items that could be menu ingredients
        const menuSuitableItems = items.filter(item =>
          item.category !== 'menu-items' && // Don't include existing menu items
          item.currentStock > 0 // Must have stock available
        )
        setAvailableItems(menuSuitableItems)
      } catch (error) {
        console.error('Error loading inventory items:', error)
        setAvailableItems([])
      } finally {
        setIsLoadingItems(false)
      }
    }

    loadItems()
  }, [])

  // Menu categories
  const menuCategories = [
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'main-course', label: 'Main Course' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'beverage', label: 'Beverage' }
  ]

  const handleItemChange = (itemId) => {
    const item = availableItems.find(i => i.id === itemId)
    if (item) {
      setSelectedItem(itemId)
      setFormData(prev => ({
        ...prev,
        inventoryItemId: item.id,
        name: item.name,
        description: item.description || '',
        // Auto-generate required ingredients based on selected item
        requiredIngredients: [{
          ingredientId: item.id,
          quantityRequired: 1, // Default to 1 unit
          unit: item.unit,
          isCritical: true
        }]
      }))
      setErrors(prev => ({ ...prev, inventoryItemId: '' }))
    }
  }

  const handleCategoryChange = (category) => {
    setFormData(prev => ({ ...prev, category }))

    // Auto-adjust preparation time based on category
    let prepTime = 20 // default
    switch (category) {
      case 'beverage':
        prepTime = 5
        break
      case 'appetizer':
        prepTime = 15
        break
      case 'main-course':
        prepTime = 25
        break
      case 'dessert':
        prepTime = 20
        break
    }

    setFormData(prev => ({ ...prev, preparationTime: prepTime }))
  }

  const handleIngredientQuantityChange = (index, quantity) => {
    setFormData(prev => ({
      ...prev,
      requiredIngredients: prev.requiredIngredients.map((ing, i) =>
        i === index ? { ...ing, quantityRequired: parseFloat(quantity) || 0 } : ing
      )
    }))
  }

  const addIngredient = () => {
    const availableForMenu = availableItems.filter(item =>
      !formData.requiredIngredients.some(ing => ing.ingredientId === item.id)
    )

    if (availableForMenu.length > 0) {
      const newIngredient = {
        ingredientId: availableForMenu[0].id,
        quantityRequired: 1,
        unit: availableForMenu[0].unit,
        isCritical: false
      }

      setFormData(prev => ({
        ...prev,
        requiredIngredients: [...prev.requiredIngredients, newIngredient]
      }))
    }
  }

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      requiredIngredients: prev.requiredIngredients.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}

    if (!formData.inventoryItemId) {
      newErrors.inventoryItemId = 'Please select an inventory item'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Menu item name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.preparationTime <= 0) {
      newErrors.preparationTime = 'Preparation time must be greater than 0'
    }

    if (formData.requiredIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required'
    }

    // Validate ingredient quantities
    formData.requiredIngredients.forEach((ing, index) => {
      if (ing.quantityRequired <= 0) {
        newErrors[`ingredient_${index}`] = 'Quantity must be greater than 0'
      }
    })

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // Prepare the menu item data
      const menuItemData = {
        inventoryItemId: formData.inventoryItemId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        preparationTime: parseInt(formData.preparationTime),
        requiredIngredients: formData.requiredIngredients,
        isAvailable: true, // New menu items start as available
        currentStock: 1, // Menu items have conceptual stock
        unit: 'servings',
        restockThreshold: 0,
        location: 'Kitchen'
      }

      onSubmit(menuItemData)
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Inventory Item Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base Inventory Item *
        </label>
        <select
          value={selectedItem}
          onChange={(e) => handleItemChange(e.target.value)}
          disabled={isLoadingItems}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
            isLoadingItems ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${errors.inventoryItemId ? 'border-red-500' : ''}`}
        >
          <option value="">
            {isLoadingItems ? 'Loading inventory items...' : 'Select inventory item to create menu item from'}
          </option>
          {availableItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.currentStock} {item.unit} available)
            </option>
          ))}
        </select>
        {errors.inventoryItemId && (
          <p className="mt-1 text-sm text-red-600">{errors.inventoryItemId}</p>
        )}
        {availableItems.length === 0 && !isLoadingItems && (
          <p className="mt-1 text-sm text-amber-600">
            No inventory items available. Add items to inventory first.
          </p>
        )}
      </div>

      {/* Menu Item Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Menu Item Name *"
          value={formData.name}
          onChange={(value) => updateField('name', value)}
          placeholder="e.g., Grilled Salmon, Caesar Salad"
          error={errors.name}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
              errors.category ? 'border-red-500' : ''
            }`}
          >
            {menuCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>
      </div>

      <Input
        label="Description"
        value={formData.description}
        onChange={(value) => updateField('description', value)}
        placeholder="Optional description of the menu item"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Preparation Time (minutes) *"
          type="number"
          value={formData.preparationTime}
          onChange={(value) => updateField('preparationTime', parseInt(value) || 0)}
          min="1"
          error={errors.preparationTime}
        />

        <div className="flex items-end">
          <Button
            type="button"
            onClick={addIngredient}
            variant="outline"
            className="w-full"
            disabled={availableItems.length <= formData.requiredIngredients.length}
          >
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* Required Ingredients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Required Ingredients *
        </label>
        <div className="space-y-3">
          {formData.requiredIngredients.map((ingredient, index) => {
            const item = availableItems.find(i => i.id === ingredient.ingredientId)
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item?.name || 'Unknown Item'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Available: {item?.currentStock || 0} {item?.unit || ''}
                  </p>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    value={ingredient.quantityRequired}
                    onChange={(e) => handleIngredientQuantityChange(index, e.target.value)}
                    min="0.01"
                    step="0.01"
                    className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-black ${
                      errors[`ingredient_${index}`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Qty"
                  />
                </div>

                <span className="text-sm text-gray-600 w-12">
                  {ingredient.unit}
                </span>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ingredient.isCritical}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requiredIngredients: prev.requiredIngredients.map((ing, i) =>
                        i === index ? { ...ing, isCritical: e.target.checked } : ing
                      )
                    }))}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="ml-1 text-xs text-gray-600">Critical</span>
                </label>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIngredient(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>

        {formData.requiredIngredients.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No ingredients added yet. Click "Add Ingredient" to get started.
          </p>
        )}

        {errors.ingredients && (
          <p className="mt-1 text-sm text-red-600">{errors.ingredients}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isLoadingItems}
          className="bg-black text-white hover:bg-gray-800"
        >
          {isLoading ? 'Creating Menu Item...' : 'Create Menu Item'}
        </Button>
      </div>
    </form>
  )
}