'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import kitchenApi from '../../lib/kitchenApi'
import menuApi from '../../lib/menuApi'
import inventoryApi from '../../lib/inventoryApi'

export default function PrepChecklist() {
    const [menuItems, setMenuItems] = useState([])
    const [selectedItems, setSelectedItems] = useState([])
    const [prepTasks, setPrepTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('planning') // planning, active, history

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                const items = await menuApi.getAvailableItems()
                setMenuItems(items)
            } catch (error) {
                console.error('Error loading menu items:', error)
            } finally {
                setIsLoading(true) // Should be false, wait
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const toggleItemSelection = (item) => {
        if (selectedItems.find(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id))
        } else {
            setSelectedItems([...selectedItems, item])
        }
    }

    const generatePrepList = () => {
        const tasks = []
        selectedItems.forEach(item => {
            item.requiredIngredients?.forEach(ing => {
                const existingTask = tasks.find(t => t.ingredientId === ing.ingredientId)
                if (existingTask) {
                    existingTask.totalQuantity += parseFloat(ing.quantity)
                    existingTask.affectedItems.push(item.name)
                } else {
                    tasks.push({
                        ingredientId: ing.ingredientId,
                        ingredientName: ing.name,
                        totalQuantity: parseFloat(ing.quantity),
                        unit: ing.unit,
                        status: 'pending',
                        affectedItems: [item.name]
                    })
                }
            })
        })
        setPrepTasks(tasks)
        setActiveTab('active')
    }

    const updateTaskStatus = (index, newStatus) => {
        const newTasks = [...prepTasks]
        newTasks[index].status = newStatus
        setPrepTasks(newTasks)
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('planning')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'planning' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Planning
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'active' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Active Tasks ({prepTasks.filter(t => t.status !== 'completed').length})
                </button>
            </div>

            <div className="p-4">
                {activeTab === 'planning' && (
                    <div className="space-y-4">
                        <h3 className="font-heading font-medium text-gray-900">Select items to prep for today</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                            {menuItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItemSelection(item)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedItems.find(i => i.id === item.id) ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{item.name}</span>
                                        {selectedItems.find(i => i.id === item.id) && (
                                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm text-gray-500">{selectedItems.length} items selected</span>
                            <Button
                                disabled={selectedItems.length === 0}
                                onClick={generatePrepList}
                                variant="primary"
                                className="w-full sm:w-auto"
                            >
                                Generate Prep List
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {prepTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No active prep tasks. Start by planning your shift.</p>
                                <Button variant="ghost" className="mt-4" onClick={() => setActiveTab('planning')}>
                                    Go to Planning
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {prepTasks.map((task, index) => (
                                    <div key={index} className={`p-4 border rounded-lg transition-all ${task.status === 'completed' ? 'bg-gray-50 border-gray-100' : 'border-gray-200'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                                <h4 className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                    {task.ingredientName}
                                                </h4>
                                            </div>
                                            <span className="text-sm font-bold">{task.totalQuantity} {task.unit}</span>
                                        </div>

                                        <p className="text-xs text-gray-400 mb-3">Needed for: {task.affectedItems.join(', ')}</p>

                                        <div className="flex items-center space-x-2">
                                            {task.status === 'pending' && (
                                                <button
                                                    onClick={() => updateTaskStatus(index, 'in-progress')}
                                                    className="flex-1 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors"
                                                >
                                                    Start Task
                                                </button>
                                            )}
                                            {(task.status === 'pending' || task.status === 'in-progress') && (
                                                <button
                                                    onClick={() => updateTaskStatus(index, 'completed')}
                                                    className="flex-1 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                            {task.status === 'completed' && (
                                                <button
                                                    onClick={() => updateTaskStatus(index, 'in-progress')}
                                                    className="flex-1 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                                                >
                                                    Redo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
