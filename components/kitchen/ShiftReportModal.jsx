'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import inventoryApi from '../../lib/inventoryApi'
import kitchenApi from '../../lib/kitchenApi'
import toast from '../../lib/toast'

export default function ShiftReportModal({ onCancel, onSubmit }) {
    const [criticalItems, setCriticalItems] = useState([])
    const [reconciliations, setReconciliations] = useState({})
    const [notes, setNotes] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const loadCriticalItems = async () => {
            try {
                setIsLoading(true)
                const items = await inventoryApi.getAll()
                // Focus on perishable/expensive categories for kitchen shift reports
                const targets = items.filter(item =>
                    ['raw-materials', 'fresh-produce', 'meat-poultry', 'seafood'].includes(item.category)
                ).slice(0, 8) // Limit to top 8 for a quick shift report

                setCriticalItems(targets)

                const initialRecs = {}
                targets.forEach(item => {
                    initialRecs[item.id] = {
                        id: item.id,
                        name: item.name,
                        expected: item.currentStock,
                        actual: item.currentStock,
                        unit: item.unit
                    }
                })
                setReconciliations(initialRecs)
            } catch (error) {
                console.error('Error loading items for shift report:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadCriticalItems()
    }, [])

    const handleActualChange = (itemId, value) => {
        setReconciliations(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                actual: parseFloat(value) || 0
            }
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)

            const reportData = {
                items: Object.values(reconciliations),
                notes,
                submittedAt: new Date().toISOString(),
                staffId: 'kitchen-staff-001' // Mocked for now
            }

            await kitchenApi.saveShiftReport(reportData)

            // Also trigger stock updates for discrepancies if needed
            for (const item of reportData.items) {
                if (item.actual !== item.expected) {
                    const diff = item.actual - item.expected
                    await inventoryApi.updateStock(item.id, diff, {
                        type: 'adjustment',
                        reason: 'shift-reconciliation',
                        notes: `End of shift adjustment. Notes: ${notes}`
                    })
                }
            }

            toast.success('Shift report submitted and stock levels synchronized.')
            onSubmit(reportData)
        } catch (error) {
            console.error('Error submitting shift report:', error)
            toast.error('Failed to submit shift report.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <div className="p-8 text-center">Loading critical items...</div>

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-sm text-amber-800">
                    <strong>End of Shift Reconciliation:</strong> Please verify the final counts for these high-turnover items. Discrepancies will be logged as adjustments.
                </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                {criticalItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">Expected: {item.currentStock} {item.unit}</p>
                        </div>
                        <div className="flex items-center space-x-2 w-32">
                            <Input
                                type="number"
                                value={reconciliations[item.id]?.actual}
                                onChange={(val) => handleActualChange(item.id, val)}
                                className="text-right h-9"
                                step="0.1"
                                min="0"
                                required
                            />
                            <span className="text-xs text-gray-500 w-8">{item.unit}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-black focus:border-black"
                    rows={3}
                    placeholder="Any issues, shortages, or handovers for the next shift?"
                ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={onCancel} type="button">
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    loading={isSubmitting}
                >
                    Submit Report
                </Button>
            </div>
        </form>
    )
}
