'use client'

import { useState, useEffect } from 'react'
import firebaseDB from '../../../lib/firebase'
import Badge from '../../../components/ui/Badge'
import { usePageTitle } from '../../../hooks/usePageTitle'

export default function ActivityLogPage() {
    const { setTitle } = usePageTitle()
    const [logs, setLogs] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setTitle('Activity Audit Trail')
        const unsubscribe = firebaseDB.onValue('activityLogs', (data) => {
            // Sort by timestamp descending
            const sortedLogs = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            setLogs(sortedLogs)
            setIsLoading(false)
        })
        return unsubscribe
    }, [setTitle])

    const getBadgeVariant = (type) => {
        if (type.includes('CREATE')) return 'success'
        if (type.includes('DELETE')) return 'critical'
        if (type.includes('UPDATE')) return 'warning'
        return 'neutral'
    }

    if (isLoading) return <div className="p-8">Syncing audit logs...</div>

    return (
        <div className="p-4 mx-2">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">System Audit Trail</h1>
                <p className="text-gray-500 text-sm">Immutable history of all inventory and procurement actions.</p>
            </div>

            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entity</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No activity recorded yet</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <Badge variant={getBadgeVariant(log.type)}>{log.type.replace('_', ' ')}</Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                            {log.itemName || log.orderNumber || log.itemId || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {log.userRole?.replace('-', ' ') || 'system'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
