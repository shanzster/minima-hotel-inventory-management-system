'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ImageUpload from './ImageUpload'
import inventoryApi from '../../lib/inventoryApi'

export default function AddMenuItemForm({ onSubmit, onCancel, isLoading = false }) {
  const [availableItems, setAvailableItems] = useState([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'main-course',
    price: 0,
    preparationTime: 20,
    requiredIngredients: [],
    imageUrl: '',
    imageMetadata: null
  })
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

  const handleImageUpload = (imageData) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: imageData.url,
      imageMetadata: {
        publicId: imageData.publicId,
        width: imageData.width,
        height: imageData.height,
        size: imageData.size,
        format: imageData.format
      }
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

    if (!formData.name.trim()) {
      newErrors.name = 'Menu item name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.preparationTime <= 0) {
      newErrors.preparationTime = 'Preparation time must be greater than 0'
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    /*
        if (formData.requiredIngredients.length === 0) {
          newErrors.ingredients = 'At least one ingredient is required'
        }
    */

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
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        preparationTime: parseInt(formData.preparationTime),
        requiredIngredients: formData.requiredIngredients,
        imageUrl: formData.imageUrl || '',
        imageMetadata: formData.imageMetadata || null,
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
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

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
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.category ? 'border-red-500' : ''
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

      {/* Menu Item Image Upload */}
      <div className="border-t pt-6">
        <ImageUpload
          onImageUpload={handleImageUpload}
          imageUrl={formData.imageUrl}
          imageAlt={formData.name || 'Menu Item'}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Preparation Time (minutes) *"
          type="number"
          value={formData.preparationTime}
          onChange={(value) => updateField('preparationTime', parseInt(value) || 0)}
          min="1"
          error={errors.preparationTime}
        />

        <Input
          label="Price (₱) *"
          type="number"
          value={formData.price}
          onChange={(value) => updateField('price', parseFloat(value) || 0)}
          min="0"
          step="0.01"
          placeholder="0.00"
          error={errors.price}
        />
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