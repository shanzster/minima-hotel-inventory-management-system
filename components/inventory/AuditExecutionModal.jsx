'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import toast from '../../lib/toast'

export default function AuditExecutionModal({
    audit,
    onSubmit,
    onCancel
}) {
    const [items, setItems] = useState(() => {
        // Initialize items with conditionBreakdown if not present
        return (audit.items || []).map(item => ({
            ...item,
            conditionBreakdown: item.conditionBreakdown || {
                good: '',
                damaged: '',
                expired: '',
                missing: ''
            }
        }))
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState(0)

    const handleUpdateItem = (index, field, value) => {
        const updatedItems = [...items]
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        }

        // Auto-calculate actual stock from condition breakdown
        if (field === 'conditionBreakdown') {
            const breakdown = value
            const actualStock = (breakdown.good || 0) + (breakdown.damaged || 0) + (breakdown.expired || 0) + (breakdown.missing || 0)
            updatedItems[index].actualStock = actualStock
            
            const expected = parseFloat(updatedItems[index].expectedStock) || 0
            updatedItems[index].discrepancy = actualStock - expected
        }

        // Auto-calculate discrepancy (legacy support for direct actualStock input)
        if (field === 'actualStock') {
            const actual = parseFloat(value) || 0
            const expected = parseFloat(updatedItems[index].expectedStock) || 0
            updatedItems[index].discrepancy = actual - expected
        }

        setItems(updatedItems)
    }

    const handleConditionChange = (index, condition, value) => {
        const updatedItems = [...items]
        const item = updatedItems[index]
        
        // Initialize conditionBreakdown if it doesn't exist
        if (!item.conditionBreakdown) {
            item.conditionBreakdown = {
                good: '',
                damaged: '',
                expired: '',
                missing: ''
            }
        }
        
        // Update the specific condition - keep as string if empty, convert to number if has value
        item.conditionBreakdown[condition] = value
        
        // Calculate total actual stock from all conditions (treat empty as 0)
        const actualStock = 
            (parseInt(item.conditionBreakdown.good) || 0) + 
            (parseInt(item.conditionBreakdown.damaged) || 0) + 
            (parseInt(item.conditionBreakdown.expired) || 0) + 
            (parseInt(item.conditionBreakdown.missing) || 0)
        
        item.actualStock = actualStock
        
        // Calculate discrepancy
        const expected = parseFloat(item.expectedStock) || 0
        item.discrepancy = actualStock - expected
        
        setItems(updatedItems)
    }

    const handleFinalize = async () => {
        // Check if all items have condition breakdown
        const incompleteItems = items.filter(item => {
            const breakdown = item.conditionBreakdown
            if (!breakdown) return true
            const total = (parseInt(breakdown.good) || 0) + (parseInt(breakdown.damaged) || 0) + (parseInt(breakdown.expired) || 0) + (parseInt(breakdown.missing) || 0)
            return total === 0
        })
        
        if (incompleteItems.length > 0) {
            if (!confirm(`There are ${incompleteItems.length} items without recorded stock levels. Do you want to finalize anyway?`)) {
                return
            }
        }

        setIsSubmitting(true)
        try {
            // Calculate overall compliance score
            const totalItems = items.length
            const accurateItems = items.filter(item => Math.abs(item.discrepancy) === 0).length
            const complianceScore = Math.round((accurateItems / totalItems) * 100)

            // Convert condition breakdown to numbers for storage
            const itemsWithNumbers = items.map(item => ({
                ...item,
                conditionBreakdown: {
                    good: parseInt(item.conditionBreakdown?.good) || 0,
                    damaged: parseInt(item.conditionBreakdown?.damaged) || 0,
                    expired: parseInt(item.conditionBreakdown?.expired) || 0,
                    missing: parseInt(item.conditionBreakdown?.missing) || 0
                }
            }))

            // Identify discrepancies for the audit record summary
            const discrepancies = itemsWithNumbers
                .filter(item => Math.abs(item.discrepancy) > 0)
                .map(item => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    type: item.discrepancy > 0 ? 'surplus' : 'shortage',
                    quantity: Math.abs(item.discrepancy),
                    conditionBreakdown: item.conditionBreakdown,
                    resolvedAt: null
                }))

            const updatedAudit = {
                ...audit,
                items: itemsWithNumbers,
                discrepancies,
                complianceScore,
                status: 'completed',
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            await onSubmit(updatedAudit)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSaveDraft = async () => {
        setIsSubmitting(true)
        try {
            const updatedAudit = {
                ...audit,
                items,
                updatedAt: new Date().toISOString()
            }
            await onSubmit(updatedAudit)
            toast.success('Draft saved successfully.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const activeItem = items[activeItemIndex]

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header Info */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-black text-white p-2 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{audit.auditNumber}</h2>
                            <p className="text-sm text-gray-500 font-medium">Type: {audit.auditType} • Location: {audit.scope?.locations?.join(', ') || 'Various'}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                        <Badge variant={audit.status === 'completed' ? 'success' : 'warning'}>
                            {audit.status.toUpperCase()}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Show message if no items */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Items in This Audit</h3>
                        <p className="text-gray-500 mb-4 max-w-md">
                            This audit doesn't have any items to review. This might happen if no inventory items matched the selected categories and locations when the audit was created.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left max-w-md">
                            <p className="font-semibold text-blue-900 mb-2">Audit Details:</p>
                            <ul className="space-y-1 text-blue-800">
                                <li>• Categories: {audit.scope?.categories?.join(', ') || 'None'}</li>
                                <li>• Locations: {audit.scope?.locations?.join(', ') || 'None'}</li>
                                <li>• Type: {audit.auditType}</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <>
                {/* Sidebar: Item List */}
                <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inventory Items ({items.length})</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveItemIndex(index)}
                                className={`w-full text-left p-4 transition-all hover:bg-slate-50 ${activeItemIndex === index ? 'bg-slate-100 border-l-4 border-black' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold truncate ${activeItemIndex === index ? 'text-black' : 'text-gray-700'}`}>
                                        {item.itemName}
                                    </span>
                                    {item.conditionBreakdown && ((parseInt(item.conditionBreakdown.good) || 0) + (parseInt(item.conditionBreakdown.damaged) || 0) + (parseInt(item.conditionBreakdown.expired) || 0) + (parseInt(item.conditionBreakdown.missing) || 0)) > 0 && (
                                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex items-center text-[11px] text-gray-500 space-x-2">
                                    <span>Exp: {item.expectedStock}</span>
                                    {item.actualStock !== null && (
                                        <>
                                            <span>•</span>
                                            <span className={item.discrepancy !== 0 ? 'text-amber-600 font-bold' : 'text-green-600'}>
                                                Act: {item.actualStock}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main: Item Entry */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    {activeItem ? (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{activeItem.itemName}</h3>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{activeItem.category}</span>
                                        <span>•</span>
                                        <span>{activeItem.location}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Expected Stock</p>
                                        <p className="text-3xl font-bold text-blue-900">{activeItem.expectedStock}</p>
                                    </div>

                                    <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Actual Stock (Total)</p>
                                        <p className="text-3xl font-bold text-green-900">{activeItem.actualStock || 0}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Condition Breakdown */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Stock Condition Breakdown *</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Good */}
                                            <div className="p-4 bg-green-50/50 rounded-xl border-2 border-green-100 focus-within:border-green-500 transition-all">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <label className="text-xs font-bold text-green-700 uppercase tracking-wide">Good</label>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={activeItem.conditionBreakdown?.good ?? ''}
                                                    onChange={(e) => handleConditionChange(activeItemIndex, 'good', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:outline-none text-green-900 placeholder-green-200"
                                                />
                                            </div>

                                            {/* Damaged */}
                                            <div className="p-4 bg-orange-50/50 rounded-xl border-2 border-orange-100 focus-within:border-orange-500 transition-all">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                                                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <label className="text-xs font-bold text-orange-700 uppercase tracking-wide">Damaged</label>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={activeItem.conditionBreakdown?.damaged ?? ''}
                                                    onChange={(e) => handleConditionChange(activeItemIndex, 'damaged', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:outline-none text-orange-900 placeholder-orange-200"
                                                />
                                            </div>

                                            {/* Expired */}
                                            <div className="p-4 bg-red-50/50 rounded-xl border-2 border-red-100 focus-within:border-red-500 transition-all">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <label className="text-xs font-bold text-red-700 uppercase tracking-wide">Expired</label>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={activeItem.conditionBreakdown?.expired ?? ''}
                                                    onChange={(e) => handleConditionChange(activeItemIndex, 'expired', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:outline-none text-red-900 placeholder-red-200"
                                                />
                                            </div>

                                            {/* Missing */}
                                            <div className="p-4 bg-gray-50/50 rounded-xl border-2 border-gray-200 focus-within:border-gray-500 transition-all">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Missing</label>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={activeItem.conditionBreakdown?.missing ?? ''}
                                                    onChange={(e) => handleConditionChange(activeItemIndex, 'missing', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:outline-none text-gray-900 placeholder-gray-300"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Discrepancy Status */}
                                    <div className={`p-4 rounded-xl border flex items-center justify-between ${activeItem.discrepancy === 0
                                        ? 'bg-green-50/50 border-green-100 text-green-800'
                                        : (activeItem.actualStock === null || activeItem.actualStock === '' || activeItem.actualStock === 0)
                                            ? 'bg-slate-50 border-gray-100 text-gray-400'
                                            : 'bg-amber-50/50 border-amber-100 text-amber-800'
                                        }`}>
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-full mr-3 ${activeItem.discrepancy === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                                                {activeItem.discrepancy === 0 ? (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="font-bold">
                                                {activeItem.discrepancy === 0 ? 'Stock Balanced' : (activeItem.actualStock === null || activeItem.actualStock === '' || activeItem.actualStock === 0) ? 'Awaiting Input' : `Variance Identified: ${activeItem.discrepancy > 0 ? '+' : ''}${activeItem.discrepancy}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Remarks</label>
                                        <textarea
                                            value={activeItem.remarks || ''}
                                            onChange={(e) => handleUpdateItem(activeItemIndex, 'remarks', e.target.value)}
                                            placeholder="Add observation notes..."
                                            rows={3}
                                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-black transition-all resize-none text-sm placeholder-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => setActiveItemIndex(Math.max(0, activeItemIndex - 1))}
                                        disabled={activeItemIndex === 0}
                                        className="flex items-center text-sm font-bold text-gray-500 hover:text-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Previous Item
                                    </button>

                                    <div className="text-xs font-bold text-gray-300">
                                        Item {activeItemIndex + 1} of {items.length}
                                    </div>

                                    <button
                                        onClick={() => setActiveItemIndex(Math.min(items.length - 1, activeItemIndex + 1))}
                                        disabled={activeItemIndex === items.length - 1}
                                        className="flex items-center text-sm font-bold text-gray-500 hover:text-black disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    >
                                        Next Item
                                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <p className="font-medium text-lg">Select an item to begin entry</p>
                        </div>
                    )}
                </div>
                </>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="font-bold text-gray-500 hover:text-gray-900"
                >
                    Close Without Saving
                </Button>

                <div className="flex space-x-3">
                    <Button
                        onClick={handleSaveDraft}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        className="bg-white text-black border-2 border-slate-200 hover:bg-slate-50 px-8 py-3 rounded-xl font-bold"
                    >
                        Save Progress
                    </Button>
                    <Button
                        onClick={handleFinalize}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        className="bg-black text-white hover:bg-gray-800 px-10 py-3 rounded-xl font-bold shadow-lg"
                    >
                        Finalize Audit
                    </Button>
                </div>
            </div>
        </div>
    )
}
