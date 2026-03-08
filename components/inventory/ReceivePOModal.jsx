'use client'

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import inventoryApi from '../../lib/inventoryApi'
import purchaseOrderApi from '../../lib/purchaseOrderApi'
import supplierApi from '../../lib/supplierApi'
import { formatCurrency } from '../../lib/utils'

export default function ReceivePOModal({
    isOpen,
    onClose,
    order,
    onSuccess
}) {
    const [receivingData, setReceivingData] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const [totalReceivedValue, setTotalReceivedValue] = useState(0)

    useEffect(() => {
        if (order && order.items) {
            const initialData = {}
            let total = 0
            order.items.forEach((item, index) => {
                const id = item.id || `item_${index}`
                initialData[id] = {
                    orderedQuantity: item.quantity,
                    receivedQuantity: item.quantity,
                    unitCost: item.unitCost || item.unitPrice || 0,
                    batchNumber: `BAT-${order.orderNumber}-${index + 1}`,
                    expirationDate: '',
                    itemName: item.itemName || item.name,
                    itemId: item.itemId || item.id,
                    unit: item.itemUnit || item.unit,
                    isChecked: true
                }
                total += item.quantity * (item.unitCost || item.unitPrice || 0)
            })
            setReceivingData(initialData)
            setTotalReceivedValue(total)
        }
    }, [order])

    useEffect(() => {
        // Recalculate total value whenever quantities change
        const newTotal = Object.values(receivingData).reduce((sum, item) => {
            if (!item.isChecked) return sum
            return sum + (parseFloat(item.receivedQuantity) || 0) * (item.unitCost || 0)
        }, 0)
        setTotalReceivedValue(newTotal)
    }, [receivingData])

    const handleInputChange = (id, field, value) => {
        setReceivingData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }))
    }

    const toggleItem = (id) => {
        setReceivingData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                isChecked: !prev[id].isChecked
            }
        }))
    }

    const triggerPrintReceipt = (processedData, finalTotal) => {
        const printWindow = window.open('', '_blank')
        const itemsHtml = Object.values(processedData)
            .filter(item => item.isChecked && parseFloat(item.receivedQuantity) > 0)
            .map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${item.itemName}</td>
                    <td style="padding: 10px;">${item.batchNumber}</td>
                    <td style="padding: 10px;">${item.orderedQuantity} ${item.unit}</td>
                    <td style="padding: 10px; font-weight: bold;">${item.receivedQuantity} ${item.unit}</td>
                    <td style="padding: 10px; color: ${parseFloat(item.receivedQuantity) < item.orderedQuantity ? 'red' : 'inherit'}">
                        ${(item.receivedQuantity - item.orderedQuantity).toFixed(2)}
                    </td>
                    <td style="padding: 10px; text-align: right;">${formatCurrency(item.receivedQuantity * item.unitCost)}</td>
                </tr>
            `).join('')

        printWindow.document.write(`
            <html>
                <head>
                    <title>Internal Receiving Note - ${order.orderNumber}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; }
                        th { background: #f4f4f4; text-align: left; padding: 10px; }
                        .summary { margin-top: 40px; text-align: right; font-size: 18px; font-weight: bold; }
                        .footer { margin-top: 60px; border-top: 1px solid #ccc; pt: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="title">INTERNAL RECEIVING NOTE</div>
                            <p>Order #: ${order.orderNumber}</p>
                            <p>Supplier: ${order.supplier?.name}</p>
                        </div>
                        <div style="text-align: right;">
                            <p>Date: ${new Date().toLocaleDateString()}</p>
                            <p>Status: Delivered / Verified</p>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th>Batch #</th>
                                <th>Ordered</th>
                                <th>Received</th>
                                <th>Discrepancy</th>
                                <th style="text-align: right;">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="summary">
                        Total Value Received: ${formatCurrency(finalTotal)}
                    </div>

                    <div class="footer">
                        <p>Purchasing Officer Signature: _________________________</p>
                        <p>Inventory Controller Verified: _________________________</p>
                        <p>Printed on ${new Date().toLocaleString()}</p>
                    </div>
                    <script>window.onload = () => { window.print(); }</script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    const handleReceive = async () => {
        setIsSaving(true)
        try {
            const itemsToProcess = Object.values(receivingData).filter(i => i.isChecked)

            for (const item of itemsToProcess) {
                const qty = parseFloat(item.receivedQuantity)
                if (qty > 0) {
                    await inventoryApi.updateBatchStock(
                        item.itemId,
                        {
                            batchNumber: item.batchNumber,
                            expirationDate: item.expirationDate
                        },
                        qty,
                        {
                            reason: 'po-receipt',
                            orderNumber: order.orderNumber,
                            notes: `Received from PO ${order.orderNumber}. Discrepancy: ${qty - item.orderedQuantity}`,
                            performedBy: 'purchasing-officer'
                        }
                    )
                }
            }

            const receivedAt = new Date().toISOString()

            // Update PO Status to delivered with final received total
            await purchaseOrderApi.update(order.id, {
                status: 'delivered',
                receivedAt: receivedAt,
                actualTotalAmount: totalReceivedValue,
                statusHistory: [
                    ...(order.statusHistory || []),
                    {
                        status: 'delivered',
                        reason: `Received with discrepancies. Adjusted Total: ${formatCurrency(totalReceivedValue)}`,
                        changedBy: 'purchasing-officer',
                        changedAt: receivedAt
                    }
                ]
            })

            // Update supplier performance metrics
            if (order.supplierId && order.expectedDelivery) {
                try {
                    // Check if there were any quality issues (discrepancies)
                    const hasQualityIssue = itemsToProcess.some(item => 
                        Math.abs(parseFloat(item.receivedQuantity) - item.orderedQuantity) > 0
                    )

                    await supplierApi.updatePerformanceMetrics(order.supplierId, {
                        expectedDeliveryDate: order.expectedDelivery,
                        actualDeliveryDate: receivedAt,
                        hasQualityIssue: hasQualityIssue
                    })
                } catch (perfError) {
                    console.error('Failed to update supplier performance:', perfError)
                    // Don't fail the entire operation if performance update fails
                }
            }

            // Trigger Print Receipt pop-up
            triggerPrintReceipt(receivingData, totalReceivedValue)

            if (onSuccess) onSuccess()
            onClose()
        } catch (error) {
            console.error('Failed to receive PO:', error)
            alert('Error processing receipt. Some items might not have been updated.')
        } finally {
            setIsSaving(false)
        }
    }

    if (!order) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Checklist & Discrepancy Checker: ${order.orderNumber}`}
            size="3xl"
        >
            <div className="space-y-6">
                <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                    <div>
                        <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mb-1">Total Verified Value</p>
                        <h3 className="text-3xl font-heading font-black">{formatCurrency(totalReceivedValue)}</h3>
                    </div>
                    <div className="text-right">
                        <Badge variant="success" className="bg-green-500/20 text-green-400 border-green-500/30">Receiving Live</Badge>
                        <p className="text-[10px] text-gray-400 mt-2">Original: {formatCurrency(order.totalAmount)}</p>
                    </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
                    {Object.entries(receivingData).map(([id, item]) => {
                        const shortage = item.orderedQuantity - (parseFloat(item.receivedQuantity) || 0)

                        return (
                            <div key={id} className={`relative border rounded-lg p-3 transition-all ${item.isChecked ? 'border-indigo-300 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={item.isChecked}
                                        onChange={() => toggleItem(id)}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                                    />

                                    <div className="flex-1 space-y-2.5 min-w-0">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-heading font-bold text-gray-900 text-sm">{item.itemName}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Unit Cost: {formatCurrency(item.unitCost)} • Ordered: {item.orderedQuantity}
                                                </p>
                                            </div>
                                            {shortage !== 0 && item.isChecked && (
                                                <div className="flex-shrink-0">
                                                    <Badge variant={shortage > 0 ? 'critical' : 'success'}>
                                                        {shortage > 0 ? `Short ${shortage}` : `+${Math.abs(shortage)}`}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {item.isChecked && (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {/* Received Quantity with +/- buttons */}
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-600 uppercase block">Received Qty *</label>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleInputChange(id, 'receivedQuantity', Math.max(0, parseFloat(item.receivedQuantity || 0) - 1))}
                                                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg shadow-md active:scale-95 transition-all"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={item.receivedQuantity}
                                                                onChange={(e) => handleInputChange(id, 'receivedQuantity', e.target.value)}
                                                                className="flex-1 min-w-0 px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold text-base text-center"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleInputChange(id, 'receivedQuantity', parseFloat(item.receivedQuantity || 0) + 1)}
                                                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg shadow-md active:scale-95 transition-all"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Difference Display */}
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-600 uppercase block">Difference</label>
                                                        <div className={`h-10 px-3 py-2.5 rounded-lg border-2 text-sm font-bold flex items-center justify-center ${
                                                            shortage === 0 ? 'border-gray-300 text-gray-600 bg-gray-50' :
                                                            shortage > 0 ? 'border-red-300 text-red-600 bg-red-50' :
                                                            'border-green-300 text-green-600 bg-green-50'
                                                        }`}>
                                                            {shortage === 0 ? '0' : shortage > 0 ? `-${shortage}` : `+${Math.abs(shortage)}`}
                                                        </div>
                                                    </div>

                                                    {/* Condition */}
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-600 uppercase block">Condition</label>
                                                        <select
                                                            value={item.condition || 'good'}
                                                            onChange={(e) => handleInputChange(id, 'condition', e.target.value)}
                                                            className="w-full h-10 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-medium"
                                                        >
                                                            <option value="good">✓ Good</option>
                                                            <option value="damaged">✗ Damaged</option>
                                                            <option value="partial">⚠ Partial</option>
                                                        </select>
                                                    </div>

                                                    {/* Notes */}
                                                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                                        <label className="text-[10px] font-bold text-gray-600 uppercase block">Notes</label>
                                                        <input
                                                            type="text"
                                                            value={item.notes || ''}
                                                            onChange={(e) => handleInputChange(id, 'notes', e.target.value)}
                                                            placeholder="Optional notes"
                                                            className="w-full h-10 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="pt-2 border-t border-gray-200">
                                                    <p className="text-sm font-bold text-gray-700">
                                                        Received Total: <span className="text-indigo-600">{formatCurrency((parseFloat(item.receivedQuantity) || 0) * item.unitCost)}</span>
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <div className="text-xs text-gray-400 max-w-sm italic">
                        * Confirming will update inventory batches and trigger an automatic printable receipt pop-up.
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button
                            onClick={handleReceive}
                            disabled={isSaving}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all font-bold"
                        >
                            {isSaving ? 'Updating Inventory...' : 'Confirm & Print Receipt'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
