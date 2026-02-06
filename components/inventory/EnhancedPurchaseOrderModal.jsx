'use client'

import { useState, useEffect, useMemo } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import supplierApi from '../../lib/supplierApi'
import { formatCurrency } from '../../lib/utils'
import { CURRENCY } from '../../lib/constants'

export default function EnhancedPurchaseOrderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  availableItems = [] 
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [orderDetails, setOrderDetails] = useState({
    priority: 'normal',
    expectedDelivery: '',
    notes: ''
  })
  
  const [availableSuppliers, setAvailableSuppliers] = useState([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  // Load suppliers on component mount
  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
    }
  }, [isOpen])

  const loadSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true)
      const suppliers = await supplierApi.getActiveSuppliers()
      setAvailableSuppliers(suppliers)
    } catch (error) {
      console.error('Error loading suppliers:', error)
      setAvailableSuppliers([])
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1)
      setSelectedSupplier(null)
      setSelectedCategory('all')
      setSearchQuery('')
      setCart([])
      setOrderDetails({
        priority: 'normal',
        expectedDelivery: '',
        notes: ''
      })
      setErrors({})
      setIsSubmitting(false)
      setShowConfirmationModal(false)
    }
  }, [isOpen])

  // Get unique categories from available items
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(availableItems.map(item => item.category).filter(Boolean))]
    return cats
  }, [availableItems])

  // Filter items by selected category and search query
  const filteredItems = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? availableItems 
      : availableItems.filter(item => item.category === selectedCategory)
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.unit?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [availableItems, selectedCategory, searchQuery])

  // Calculate cart totals
  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0), [cart]
  )
  
  const cartItemCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), [cart]
  )

  // Handle supplier selection
  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier)
    setCurrentStep(2)
  }

  // Add item to cart with smart pricing
  const addToCart = (item, unitCost = null) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id)
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += 1
      setCart(updatedCart)
    } else {
      // Auto-populate unit cost from item.cost field, with fallbacks
      const autoUnitCost = unitCost || item.cost || item.estimatedCost || item.lastPurchasePrice || 0
      
      setCart([...cart, {
        id: item.id,
        name: item.name,
        unit: item.unit,
        category: item.category,
        image: item.image || '/icons/images/placeholder-product.svg',
        quantity: 1,
        unitCost: autoUnitCost,
        suggestedCost: item.cost || item.estimatedCost || item.lastPurchasePrice || 0,
        lowStock: (item.currentStock || 0) <= (item.reorderLevel || 0)
      }])
    }
  }

  // Update cart item quantity
  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId))
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  // Update cart item unit cost
  const updateCartUnitCost = (itemId, newUnitCost) => {
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, unitCost: parseFloat(newUnitCost) || 0 } : item
    ))
  }

  // Bulk add suggested quantities for low stock items
  const addLowStockItems = () => {
    const lowStockItems = availableItems.filter(item => 
      (item.currentStock || 0) <= (item.reorderLevel || 0)
    )
    
    lowStockItems.forEach(item => {
      const suggestedQuantity = Math.max(1, (item.reorderLevel || 10) - (item.currentStock || 0))
      const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id)
      
      if (existingItemIndex >= 0) {
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += suggestedQuantity
        setCart(updatedCart)
      } else {
        // Use item.cost as the primary unit cost source
        const autoUnitCost = item.cost || item.estimatedCost || item.lastPurchasePrice || 0
        setCart(prevCart => [...prevCart, {
          id: item.id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          image: item.image || '/icons/images/placeholder-product.svg',
          quantity: suggestedQuantity,
          unitCost: autoUnitCost,
          suggestedCost: item.cost || item.estimatedCost || item.lastPurchasePrice || 0,
          lowStock: true
        }])
      }
    })
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Handle form submission
  const handleSubmit = async () => {
    const newErrors = {}
    
    if (!selectedSupplier) {
      newErrors.supplier = 'Please select a supplier'
    }
    
    if (cart.length === 0) {
      newErrors.items = 'Please add at least one item to the purchase order'
    }
    
    if (!orderDetails.expectedDelivery) {
      newErrors.expectedDelivery = 'Please select an expected delivery date'
    } else {
      const deliveryDate = new Date(orderDetails.expectedDelivery)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (deliveryDate < today) {
        newErrors.expectedDelivery = 'Expected delivery date cannot be in the past'
      }
    }

    // Validate cart items have unit costs
    const itemsWithoutCost = cart.filter(item => !item.unitCost || item.unitCost <= 0)
    if (itemsWithoutCost.length > 0) {
      newErrors.items = `Please set unit costs for: ${itemsWithoutCost.map(item => item.name).join(', ')}`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmationModal(true)
  }

  // Handle confirmed submission
  const handleConfirmedSubmit = async () => {
    try {
      setIsSubmitting(true)
      setShowConfirmationModal(false)
      
      // Format data for submission
      const formattedData = {
        supplier: selectedSupplier,
        items: cart.map(item => ({
          inventoryItemId: item.id,
          itemName: item.name,
          itemUnit: item.unit,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost
        })),
        totalAmount: cartTotal,
        priority: orderDetails.priority,
        expectedDelivery: new Date(orderDetails.expectedDelivery),
        notes: orderDetails.notes
      }

      console.log('Submitting purchase order data:', formattedData)
      console.log('Expected delivery date:', orderDetails.expectedDelivery, 'formatted as:', formattedData.expectedDelivery)

      await onSubmit(formattedData)
    } catch (error) {
      console.error('Error submitting purchase order:', error)
      setErrors({ submit: 'Failed to create purchase order. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step navigation
  const goToStep = (step) => {
    if (step === 2 && !selectedSupplier) return
    if (step === 3 && cart.length === 0) return
    setCurrentStep(step)
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Get low stock items count
  const lowStockCount = useMemo(() => 
    availableItems.filter(item => (item.currentStock || 0) <= (item.reorderLevel || 0)).length,
    [availableItems]
  )

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        className="w-full max-w-none h-full max-h-none m-0 rounded-none lg:max-w-[80vw] lg:max-h-[90vh] lg:m-4 lg:rounded-lg"
      >
      <div className="h-full flex flex-col bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900">Create Purchase Order</h2>
              <p className="text-sm text-gray-600">
                {currentStep === 1 && "Select your supplier"}
                {currentStep === 2 && "Choose products and build your order"}
                {currentStep === 3 && "Review and submit your order"}
              </p>
            </div>
            {selectedSupplier && (
              <Badge variant="success" className="text-sm">
                {selectedSupplier.name}
              </Badge>
            )}
          </div>
          
          {/* Enhanced Step Indicator */}
          <div className="hidden lg:flex items-center space-x-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`flex items-center space-x-3 cursor-pointer transition-all duration-200 ${
                    currentStep >= step ? 'text-black' : 'text-gray-400'
                  }`}
                  onClick={() => goToStep(step)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    currentStep >= step 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  <div className="hidden xl:block">
                    <div className="font-medium text-sm">
                      {step === 1 && "Supplier"}
                      {step === 2 && "Products"}
                      {step === 3 && "Review"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {step === 1 && "Choose supplier"}
                      {step === 2 && "Add items"}
                      {step === 3 && "Finalize order"}
                    </div>
                  </div>
                </div>
                {step < 3 && <div className="w-12 h-px bg-gray-300 mx-4"></div>}
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Step 1: Enhanced Supplier Selection */}
          {currentStep === 1 && (
            <div className="h-full p-6">
              <div className="mb-6">
                <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">Select Supplier</h3>
                <p className="text-gray-600">Choose a trusted supplier for your purchase order</p>
                {availableSuppliers.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    {availableSuppliers.length} active suppliers available
                  </div>
                )}
              </div>

              {isLoadingSuppliers ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading suppliers...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
                  {availableSuppliers.map(supplier => (
                    <div
                      key={supplier.id}
                      onClick={() => handleSupplierSelect(supplier)}
                      className="group bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:border-black/20 hover:scale-105"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-black group-hover:to-gray-800 transition-all duration-300">
                          <svg className="w-7 h-7 text-gray-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="success" className="text-xs">Active</Badge>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      
                      <h4 className="font-heading font-bold text-gray-900 mb-2 group-hover:text-black transition-colors">
                        {supplier.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4 font-medium">{supplier.contactPerson}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{supplier.email}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {supplier.phone}
                        </div>
                        {supplier.address && (
                          <div className="flex items-start">
                            <svg className="w-3 h-3 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs leading-tight">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Rating</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-3 h-3 ${i < (supplier.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-gray-600">{supplier.rating || 4.0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableSuppliers.length === 0 && !isLoadingSuppliers && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers available</h3>
                  <p className="text-gray-500 mb-6">You need to add suppliers before creating purchase orders</p>
                  <Button
                    onClick={() => window.open('/suppliers', '_blank')}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Suppliers
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Enhanced Product Selection */}
          {currentStep === 2 && (
            <div className="h-full flex">
              {/* Product Categories & Items - 50% width */}
              <div className="flex-1 flex flex-col w-1/2">
                {/* Enhanced Search and Categories Bar */}
                <div className="p-4 border-b border-white/20 bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-heading font-semibold text-gray-900">Product Catalog</h3>
                      <Badge variant="info" className="text-sm">
                        {filteredItems.length} items
                      </Badge>
                      {lowStockCount > 0 && (
                        <Badge variant="warning" className="text-sm">
                          {lowStockCount} low stock
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {lowStockCount > 0 && (
                        <Button
                          onClick={addLowStockItems}
                          variant="secondary"
                          size="sm"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          Add Low Stock
                        </Button>
                      )}
                      
                      {cart.length > 0 && (
                        <Button
                          onClick={clearCart}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          Clear Order
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search products by name, category, or unit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/20 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {/* Category Tabs */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          selectedCategory === category
                            ? 'bg-black text-white shadow-lg'
                            : 'bg-white/70 text-gray-700 hover:bg-white/90 border border-white/30'
                        }`}
                      >
                        {category === 'all' ? 'All Products' : category.charAt(0).toUpperCase() + category.slice(1)}
                        {category !== 'all' && (
                          <span className="ml-2 text-xs opacity-75">
                            ({availableItems.filter(item => item.category === category).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Products Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {filteredItems.map(item => {
                        const isLowStock = (item.currentStock || 0) <= (item.reorderLevel || 0)
                        const isInCart = cart.some(cartItem => cartItem.id === item.id)
                        const cartItem = cart.find(cartItem => cartItem.id === item.id)
                        
                        return (
                          <div
                            key={item.id}
                            className={`group relative bg-white/90 backdrop-blur-sm border rounded-xl p-4 cursor-pointer hover:shadow-2xl transition-all duration-300 ${
                              isInCart 
                                ? 'border-black/30 shadow-lg ring-2 ring-black/10' 
                                : 'border-white/30 hover:border-black/20'
                            } ${isLowStock ? 'ring-2 ring-orange-200' : ''}`}
                          >
                            {/* Stock Status Indicators */}
                            <div className="absolute top-2 right-2 flex flex-col space-y-1">
                              {isLowStock && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Low Stock"></div>
                              )}
                              {isInCart && (
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="In Cart"></div>
                              )}
                            </div>
                            
                            {/* Product Image */}
                            <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <img
                                src={item.image || '/icons/images/placeholder-product.svg'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/icons/images/placeholder-product.svg'
                                }}
                              />
                            </div>
                            
                            {/* Product Info */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-black transition-colors">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-500">per {item.unit}</p>
                              
                              {item.category && (
                                <Badge variant="info" className="text-xs">
                                  {item.category}
                                </Badge>
                              )}
                              
                              {/* Stock Info */}
                              <div className="flex items-center justify-between text-xs">
                                <span className={`${isLowStock ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                                  Stock: {item.currentStock || 0}
                                </span>
                                {item.cost && (
                                  <span className="text-gray-700 font-medium">
                                    {formatCurrency(item.cost)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Add to Cart Button */}
                              <div className="flex items-center justify-between pt-2">
                                {isInCart ? (
                                  <div className="flex items-center space-x-2 w-full">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateCartQuantity(item.id, cartItem.quantity - 1)
                                      }}
                                      className="w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs hover:bg-gray-300 transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="text-sm font-medium flex-1 text-center">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateCartQuantity(item.id, cartItem.quantity + 1)
                                      }}
                                      className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-800 transition-colors"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-full py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-1"
                                  >
                                    <span>Add to Cart</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchQuery ? 'No products found' : 'No products in this category'}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery 
                          ? `Try adjusting your search for "${searchQuery}"` 
                          : 'Try selecting a different category'
                        }
                      </p>
                      {searchQuery && (
                        <Button
                          onClick={() => setSearchQuery('')}
                          variant="ghost"
                          size="sm"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Order Summary - 50% width */}
              <div className="w-1/2 border-l border-white/20 bg-white/70 backdrop-blur-sm flex flex-col">
                <div className="p-4 border-b border-white/20 bg-white/80">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-semibold text-gray-900">Order Summary</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="info" className="text-sm">
                        {cartItemCount} items
                      </Badge>
                      {cart.length > 0 && (
                        <button
                          onClick={clearCart}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Total: <span className="font-semibold text-gray-900">{formatCurrency(cartTotal)}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white/90 rounded-xl p-4 border border-white/30 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 object-cover rounded-lg bg-gray-100"
                            onError={(e) => {
                              e.target.src = '/icons/images/placeholder-product.svg'
                            }}
                          />
                          {item.lowStock && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="Low Stock"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500">per {item.unit}</p>
                          {item.category && (
                            <Badge variant="info" className="text-xs mt-1">
                              {item.category}
                            </Badge>
                          )}
                          
                          {/* Enhanced Unit Cost Input */}
                          <div className="mt-3">
                            <label className="text-xs text-gray-600 font-medium">Unit Cost ({CURRENCY.SYMBOL})</label>
                            <div className="relative mt-1">
                              <input
                                type="number"
                                value={item.unitCost}
                                onChange={(e) => updateCartUnitCost(item.id, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/20 transition-all"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                              />
                              {item.suggestedCost > 0 && item.unitCost !== item.suggestedCost && (
                                <button
                                  onClick={() => updateCartUnitCost(item.id, item.suggestedCost)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                  title={`Reset to: ${formatCurrency(item.suggestedCost)}`}
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Auto-filled from product cost
                            </div>
                          </div>
                          
                          {/* Enhanced Quantity Controls */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
                              >
                                -
                              </button>
                              <div className="text-center min-w-[3rem]">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center text-sm font-medium bg-transparent border-none focus:outline-none"
                                  min="1"
                                />
                                <div className="text-xs text-gray-500">{item.unit}</div>
                              </div>
                              <button
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm hover:bg-gray-800 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(item.quantity * item.unitCost)}
                              </p>
                              <button
                                onClick={() => updateCartQuantity(item.id, 0)}
                                className="text-xs text-red-600 hover:text-red-800 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">Order is empty</h4>
                      <p className="text-gray-500 text-sm">Add products from the catalog</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Order Summary & Actions */}
                {cart.length > 0 && (
                  <div className="p-4 border-t border-white/20 bg-white/90 space-y-4">
                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Subtotal ({cartItemCount} items)</span>
                        <span className="font-medium">{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Estimated Tax</span>
                        <span className="font-medium">{formatCurrency(cartTotal * 0.12)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-semibold text-gray-900">Total</span>
                          <span className="font-heading font-bold text-xl text-gray-900">
                            {formatCurrency(cartTotal * 1.12)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={nextStep}
                        className="w-full bg-black text-white hover:bg-gray-800"
                        disabled={cart.length === 0 || cart.some(item => !item.unitCost || item.unitCost <= 0)}
                      >
                        Continue
                      </Button>
                      
                      {cart.length === 0 && (
                        <p className="text-xs text-gray-600 text-center">
                          Add items to continue
                        </p>
                      )}
                      
                      {cart.length > 0 && cart.some(item => !item.unitCost || item.unitCost <= 0) && (
                        <p className="text-xs text-red-600 text-center">
                          Please set unit costs for all items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">Review Purchase Order</h3>
                  <p className="text-gray-600">Review your order details before submitting</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Order Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Supplier Info */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                      <h4 className="font-heading font-semibold text-gray-900 mb-4">Supplier Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Company:</span>
                          <span className="ml-2 font-medium">{selectedSupplier?.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Contact:</span>
                          <span className="ml-2 font-medium">{selectedSupplier?.contactPerson}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <span className="ml-2 font-medium">{selectedSupplier?.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 font-medium">{selectedSupplier?.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                      <h4 className="font-heading font-semibold text-gray-900 mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                              onError={(e) => {
                                e.target.src = '/icons/images/placeholder-product.svg'
                              }}
                            />
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-500">{item.quantity} {item.unit} × {formatCurrency(item.unitCost)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(item.quantity * item.unitCost)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-semibold text-gray-900">Total Amount</span>
                          <span className="font-heading font-bold text-xl text-gray-900">
                            {formatCurrency(cartTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Settings */}
                  <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                      <h4 className="font-heading font-semibold text-gray-900 mb-4">Order Details</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                          </label>
                          <select
                            value={orderDetails.priority}
                            onChange={(e) => setOrderDetails(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="low">Low Priority</option>
                            <option value="normal">Normal Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expected Delivery Date *
                          </label>
                          <input
                            type="date"
                            value={orderDetails.expectedDelivery}
                            onChange={(e) => setOrderDetails(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                          {errors.expectedDelivery && (
                            <p className="mt-1 text-sm text-red-600">{errors.expectedDelivery}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={orderDetails.notes}
                            onChange={(e) => setOrderDetails(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="Additional notes or special instructions..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      Create Purchase Order
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-white/20 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <Button
                  onClick={prevStep}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
              
              {currentStep < 3 && currentStep === 2 && cart.length > 0 && (
                <Button
                  onClick={nextStep}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Continue
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        size="md"
        centered={true}
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">!</span>
              </div>
            </div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
              Confirm Purchase Order
            </h3>
            <p className="text-gray-600">
              Are you sure you want to create this purchase order?
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Supplier:</span>
                <span className="font-medium">{selectedSupplier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{cartItemCount} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium capitalize">{orderDetails.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Delivery:</span>
                <span className="font-medium">
                  {orderDetails.expectedDelivery ? new Date(orderDetails.expectedDelivery).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={() => setShowConfirmationModal(false)}
              variant="ghost"
              className="flex-1 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedSubmit}
              className="flex-1 bg-black text-white hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Yes, Create Order'}
            </Button>
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}