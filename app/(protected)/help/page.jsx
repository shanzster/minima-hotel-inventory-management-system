'use client'

import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTutorial, setSelectedTutorial] = useState(null)

    const workouts = [
        {
            id: 'procurement-cycle',
            title: 'End-to-End Procurement',
            category: 'Procurement',
            description: 'Master the full cycle from stock alerts to supplier payment reconciliation.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            steps: [
                'Identify Low Stock: Check the Dashboard for critical alerts and low threshold items.',
                'Generate PO: Select the preferred supplier and add items based on restock needs.',
                'Budget Verification: Review the "Budget Impact" widget to ensure the order aligns with monthly department limits.',
                'Approval Flow: Submit the Purchase Order. Once status is "Approved", the PO can be sent to the supplier.',
                'Reconcile Delivery: Upon arrival, use the "Receive Delivery" feature to verify quantities and update live stock levels.'
            ]
        },
        {
            id: 'audit-reconciliation',
            title: 'Audit & Reconciliation',
            category: 'Compliance',
            description: 'Step-by-step guide on bridging physical counts with digital inventory records.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            steps: [
                'Preparation: Click "Print Audit Form" to define scope and generate a physical counting sheet.',
                'Physical Count: Perform the count in-situ (e.g., storeroom, pantry) noting condition and remarks.',
                'Digital Entry: Select the active audit record and "Start Digital Audit" to encode physical findings.',
                'Discrepancy Analysis: Review automatic variances. The system highlights shortages (red) and surpluses (green).',
                'Finalization: Review the "Compliance Score" and finalize. This creates permanent audit logs for management.'
            ]
        },
        {
            id: 'asset-lifecycle',
            title: 'Asset Lifecycle Management',
            category: 'Operations',
            description: 'Track high-value hotel assets from acquisition through room assignment.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            steps: [
                'Asset Registration: Add assets with unique identifiers, serial numbers, and acquisition costs.',
                'Room Assignment: Assign specific units to hotel rooms or areas (e.g., Room 101, Lobby).',
                'Status Monitoring: Update asset condition (Working, Damaged, Under Maintenance) as needed.',
                'Stock Validation: The system enforces "No Stock" constraints to prevent over-assignment of assets.',
                'Retirement: Mark assets as "Retired" or "Scrapped" at end-of-life to remove from active valuation.'
            ]
        },
        {
            id: 'waste-control',
            title: 'Waste & Loss Control',
            category: 'Finance',
            description: 'Process for documenting and minimizing damaged, expired, or lost inventory.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            steps: [
                'Stock-Out Entry: Select item(s) that are being written off.',
                'Reason Specification: Choose "Damaged", "Expired", or "Lost" as the transaction reason.',
                'Batch Identification: For consumables, specify the batch/lot number and expiration date.',
                'Budget Impact: Loss values are automatically calculated and reflected in the department budget "Actuals".',
                'Corrective Action: Review monthly loss reports to adjust reorder levels or supplier choices.'
            ]
        },
        {
            id: 'menu-inventory-sync',
            title: 'Menu & Stock Sync',
            category: 'Kitchen',
            description: 'Workflow for Kitchen Staff to reconcile menu sales with ingredient levels.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            steps: [
                'Menu Review: Access "Menu Management" to see active hotel menu items.',
                'Ingredient Attribution: Link menu items to specific ingredients (e.g., Coffee Beans, Milk).',
                'Stock Consumption: Record "Guest Usage" Stock-Outs based on daily sales reports.',
                'Real-time Updates: The system adjusts ingredient levels, triggering low-stock alerts if needed.',
                'Inventory Review: Perform weekly spot-checks to ensure digital ingredient levels match the pantry.'
            ]
        }
    ]

    const filteredTutorials = workouts.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 lg:p-10 bg-whitesmoke min-h-screen">
            {/* Header Section */}
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-heading font-bold text-gray-900 leading-tight">
                            Help & <span className="text-blue-600">Support</span>
                        </h1>
                        <p className="text-gray-500 font-medium max-w-xl">
                            Master the Minima Hotel Inventory system with our comprehensive operational workflows and step-by-step guides.
                        </p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search for workflows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Tutorial Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTutorials.map((tutorial) => (
                        <div
                            key={tutorial.id}
                            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            onClick={() => setSelectedTutorial(tutorial)}
                        >
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 group-hover:bg-black group-hover:text-white transition-colors duration-300 mb-6">
                                {tutorial.icon}
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                        {tutorial.category}
                                    </span>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    {tutorial.title}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                    {tutorial.description}
                                </p>
                            </div>
                            <div className="mt-8 flex items-center text-sm font-bold text-gray-900 group-hover:translate-x-1 transition-transform">
                                <span>View Workflow</span>
                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-heading font-bold leading-tight">
                                Frequently Asked <br />Questions
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                                    <h4 className="font-bold mb-2">How do I reset my password?</h4>
                                    <p className="text-sm text-gray-400">Navigate to Settings &rarr; Account Security to update your password or contact your local system administrator.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                                    <h4 className="font-bold mb-2">Can I export data?</h4>
                                    <p className="text-sm text-gray-400">Yes, most tables include an "Export" button in the filter bar to download data as CSV or Excel.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 flex flex-col justify-center items-center text-center space-y-6">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Still need help?</h3>
                                <p className="text-gray-400">Our technical support team is available 24/7 for critical system issues.</p>
                            </div>
                            <Button className="w-full bg-white text-black hover:bg-gray-100 py-4 rounded-xl font-bold text-lg">
                                Contact Support
                            </Button>
                        </div>
                    </div>

                    {/* Abstract background shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] -ml-32 -mb-32 rounded-full"></div>
                </div>
            </div>

            {/* Tutorial Modal */}
            <Modal
                isOpen={!!selectedTutorial}
                onClose={() => setSelectedTutorial(null)}
                title={selectedTutorial?.title}
                size="lg"
            >
                {selectedTutorial && (
                    <div className="space-y-8">
                        <div className="bg-blue-50 p-6 rounded-2xl flex items-start space-x-4">
                            <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm shrink-0">
                                {selectedTutorial.icon}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-blue-900">Workflow Overview</h4>
                                <p className="text-sm text-blue-800/70 leading-relaxed font-medium">
                                    {selectedTutorial.description}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-xs mr-3 shadow-md">
                                    Steps
                                </span>
                                How To Detailed Guide
                            </h4>

                            <div className="space-y-4">
                                {selectedTutorial.steps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                                                {index + 1}
                                            </div>
                                            {index < selectedTutorial.steps.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-100 mt-2 min-h-[20px]"></div>
                                            )}
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                                {step}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <Button
                                onClick={() => setSelectedTutorial(null)}
                                className="w-full bg-gray-900 text-white hover:bg-black py-4 rounded-xl font-bold"
                            >
                                I've Finished the Workflow
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
