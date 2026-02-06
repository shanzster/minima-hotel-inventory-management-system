'use client'

import { useState, useEffect } from 'react'
import inventoryApi from '../../../../lib/inventoryApi'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import Badge from '../../../../components/ui/Badge'
import { usePageTitle } from '../../../../hooks/usePageTitle'

export default function BulkAdjustmentPage() {
    const { setTitle } = usePageTitle()
    const [items, setItems] = useState([])
    const [adjustments, setAdjustments] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setTitle('Bulk Stock Take')
        const loadItems = async () => {
            try {
                const allItems = await inventoryApi.getAll()
                setItems(allItems)
            } catch (error) {
                console.error('Failed to load items:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadItems()
    }, [setTitle])

    const handleAdjustmentChange = (itemId, value) => {
        setAdjustments(prev => ({
            ...prev,
            [itemId]: value
        }))
    }

    const handleSaveAll = async () => {
        const itemsToUpdate = Object.entries(adjustments).filter(([_, val]) => val !== '')
        if (itemsToUpdate.length === 0) return

        setIsSaving(true)
        try {
            for (const [itemId, newCount] of itemsToUpdate) {
                const item = items.find(i => i.id === itemId)
                const diff = parseFloat(newCount) - item.currentStock
                if (diff !== 0) {
                    await inventoryApi.updateStock(itemId, diff, {
                        reason: 'physical-count',
                        notes: 'Bulk stock take adjustment',
                        performedBy: 'inventory-controller'
                    })
                }
            }
            alert('All adjustments saved successfully!')
            setAdjustments({})
            const refreshed = await inventoryApi.getAll()
            setItems(refreshed)
        } catch (error) {
            console.error('Failed to save adjustments:', error)
            alert('Error saving some adjustments. Please check logs.')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <div className="p-8">Loading counts...</div>

    return (
        <div className="p-4 mx-2">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Bulk Stock Take</h1>
                    <p className="text-gray-500">Rapidly update physical counts for multiple items at once.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => setAdjustments({})}>Clear Changes</Button>
                    <Button
                        className="bg-black text-white px-8"
                        onClick={handleSaveAll}
                        disabled={isSaving || Object.keys(adjustments).length === 0}
                    >
                        {isSaving ? 'Saving...' : `Save ${Object.keys(adjustments).length} Changes`}
                    </Button>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 font-heading font-bold text-gray-600">Item Name</th>
                            <th className="px-6 py-4 font-heading font-bold text-gray-600">Location</th>
                            <th className="px-6 py-4 font-heading font-bold text-gray-600">System Count</th>
                            <th className="px-6 py-4 font-heading font-bold text-gray-600 w-48">Physical Count</th>
                            <th className="px-6 py-4 font-heading font-bold text-gray-600 text-right">Variance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map(item => {
                            const physical = adjustments[item.id] !== undefined ? adjustments[item.id] : item.currentStock
                            const variance = parseFloat(physical) - item.currentStock

                            return (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-400">{item.category}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.location}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-400">{item.currentStock} {item.unit}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            value={adjustments[item.id] || ''}
                                            placeholder={item.currentStock}
                                            onChange={(e) => handleAdjustmentChange(item.id, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-black outline-none font-bold"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right font-heading">
                                        {variance !== 0 ? (
                                            <Badge variant={variance > 0 ? 'success' : 'critical'}>
                                                {variance > 0 ? '+' : ''}{variance}
                                            </Badge>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
