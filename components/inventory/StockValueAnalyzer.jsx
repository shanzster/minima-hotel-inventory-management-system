'use client'

import { useState, useEffect } from 'react'
import inventoryApi from '../../lib/inventoryApi'
import { formatCurrency } from '../../lib/utils'

export default function StockValueAnalyzer() {
    const [stats, setStats] = useState({ totalValue: 0, categoryValues: {} })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const calculateStats = async () => {
            try {
                const items = await inventoryApi.getAll()
                let total = 0
                const categories = {}

                items.forEach(item => {
                    const value = (item.currentStock || 0) * (item.cost || 0)
                    total += value
                    const cat = item.category || 'other'
                    categories[cat] = (categories[cat] || 0) + value
                })

                setStats({ totalValue: total, categoryValues: categories })
            } catch (error) {
                console.error('Failed to analyze stock value:', error)
            } finally {
                setIsLoading(false)
            }
        }
        calculateStats()
    }, [])

    if (isLoading) return <div className="h-32 bg-gray-50 animate-pulse rounded-lg"></div>

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Total Assets Value</p>
                    <h3 className="text-4xl font-heading font-black">{formatCurrency(stats.totalValue)}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats.categoryValues).slice(0, 4).map(([cat, val]) => (
                    <div key={cat} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p className="text-[10px] text-indigo-200 uppercase font-bold truncate mb-1">{cat.replace('-', ' ')}</p>
                        <p className="text-lg font-heading font-bold">{formatCurrency(val)}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
