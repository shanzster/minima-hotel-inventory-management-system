'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import inventoryApi from '../../lib/inventoryApi'
import kitchenApi from '../../lib/kitchenApi'
import toast from '../../lib/toast'

export default function KitchenWasteModal({ onCancel, onSubmit }) {
    const [items, setItems] = useState([])
    const [selectedItem, setSelectedItem] = useState(null)
    const [formData, setFormData] = useState({
        itemId: '',
        quantity: '',
        reason: '',
        notes: ''
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const loadItems = async () => {
            try {
                setIsLoading(true)
                const inventory = await inventoryApi.getAll()
                // Filter for kitchen-relevant items
                const kitchenItems = inventory.filter(item =>
                    ['raw-materials', 'fresh-produce', 'meat-poultry', 'seafood', 'dairy', 'frozen-foods'].includes(item.category)
                )
                setItems(kitchenItems)
            } catch (error) {
                console.error('Error loading inventory:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadItems()
    }, [])

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (field === 'itemId') {
            const item = items.find(i => i.id === value)
            setSelectedItem(item)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedItem) return

        try {
            setIsSubmitting(true)
            const quantity = parseFloat(formData.quantity)

            const wasteRecord = {
                itemId: formData.itemId,
                itemName: selectedItem.name,
                quantity,
                unit: selectedItem.unit,
                reason: formData.reason,
                notes: formData.notes,
                type: 'kitchen-waste'
            }

            // Update inventory (negative quantity change)
            await inventoryApi.updateStock(formData.itemId, -quantity, {
                type: 'stock-out',
                reason: formData.reason,
                notes: `Kitchen Waste logged. Notes: ${formData.notes}`
            })

            // Log in kitchen specific logs
            await kitchenApi.logWaste(wasteRecord)

            toast.success('Kitchen waste recorded and inventory updated.')
            onSubmit(wasteRecord)
        } catch (error) {
            console.error('Error logging kitchen waste:', error)
            toast.error('Failed to log kitchen waste.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const wasteReasons = [
        { label: 'Spoilage / Expired', value: 'spoilage' },
        { label: 'Preparation Error', value: 'prep-error' },
        { label: 'Dropped / Damaged', value: 'dropped' },
        { label: 'Quality Issue', value: 'quality-issue' },
        { label: 'Burned / Overcooked', value: 'overcooked' },
        { label: 'Customer Return', value: 'customer-return' },
        { label: 'Other', value: 'other' }
    ]

    if (isLoading) return <div className="p-8 text-center">Loading kitchen inventory...</div>

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                type="select"
                label="Item"
                value={formData.itemId}
                onChange={(val) => handleInputChange('itemId', val)}
                options={items.map(item => ({ label: `${item.name} (${item.currentStock} ${item.unit} avail)`, value: item.id }))}
                placeholder="Select ingredient..."
                required
            />

            <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 w-full">
                    Quantity to Waste
                    <div className="flex items-center space-x-2 mt-1">
                        <button
                            type="button"
                            onClick={() => {
                                const current = parseFloat(formData.quantity) || 0
                                if (current > 0) handleInputChange('quantity', (current - 0.5).toString())
                            }}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg text-xl font-bold text-gray-700 hover:bg-gray-200"
                        >
                            −
                        </button>
                        <div className="flex-1">
                            <Input
                                type="number"
                                value={formData.quantity}
                                onChange={(val) => handleInputChange('quantity', val)}
                                placeholder="0.0"
                                step="0.1"
                                min="0.1"
                                required
                                className="text-center font-bold"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const current = parseFloat(formData.quantity) || 0
                                handleInputChange('quantity', (current + 0.5).toString())
                            }}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg text-xl font-bold text-gray-700 hover:bg-gray-200"
                        >
                            +
                        </button>
                    </div>
                </label>
            </div>

            <Input
                type="select"
                label="Reason"
                value={formData.reason}
                onChange={(val) => handleInputChange('reason', val)}
                options={wasteReasons}
                placeholder="Why is it being wasted?"
                required
            />

            <Input
                type="textarea"
                label="Additional Notes"
                value={formData.notes}
                onChange={(val) => handleInputChange('notes', val)}
                placeholder="Brief description of the issue..."
            />

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={onCancel} type="button">
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    loading={isSubmitting}
                    disabled={!selectedItem || !formData.quantity || !formData.reason}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    Record Waste
                </Button>
            </div>
        </form>
    )
}
