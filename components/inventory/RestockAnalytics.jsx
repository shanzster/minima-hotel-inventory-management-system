'use client'

import { useState, useEffect } from 'react'
import inventoryApi from '../../lib/inventoryApi'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function RestockAnalytics() {
    const [lowStockItems, setLowStockItems] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadItems = async () => {
            try {
                const items = await inventoryApi.getLowStockItems()
                setLowStockItems(items)
            } catch (error) {
                console.error('Failed to load low stock items:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadItems()
    }, [])

    const calculateSuggestedOrder = (item) => {
        // If there's a max stock, order up to max
        if (item.maxStock) {
            return item.maxStock - item.currentStock
        }
        // Else order enough to double the threshold
        return (item.restockThreshold * 2) - item.currentStock
    }

    if (isLoading) return <div className="p-4 animate-pulse bg-gray-50 rounded-lg h-40"></div>

    if (lowStockItems.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-green-100 p-6 shadow-sm">
                <div className="flex items-center space-x-3 text-green-600 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="font-heading font-bold text-lg">Inventory Healthy</h3>
                </div>
                <p className="text-gray-500 text-sm">All items are above restock thresholds.</p>
            </div>
        )
    }

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-lg border border-amber-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-heading font-bold text-lg text-gray-900">Restock Analytics</h3>
                    <p className="text-gray-500 text-sm">AI-suggested orders for low-stock items</p>
                </div>
                <Badge variant="low" className="px-3 py-1">
                    {lowStockItems.length} items low
                </Badge>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {lowStockItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-amber-200 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-amber-50 rounded flex items-center justify-center">
                                <span className="text-amber-700 font-bold text-xs">{item.unit}</span>
                            </div>
                            <div>
                                <h4 className="font-heading font-medium text-sm text-gray-900">{item.name}</h4>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span>Stock: {item.currentStock}</span>
                                    <span>•</span>
                                    <span>Par: {item.restockThreshold}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-amber-700">Order: +{calculateSuggestedOrder(item)}</p>
                            <button
                                className="text-xs text-black underline underline-offset-2 hover:text-gray-600"
                                onClick={() => window.location.href = '/purchase-orders'}
                            >
                                Create PO
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {lowStockItems.length > 5 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => window.location.href = '/inventory'}
                        className="text-xs text-gray-500 hover:text-black transition-colors"
                    >
                        View all {lowStockItems.length} shortages
                    </button>
                </div>
            )}
        </div>
    )
}
