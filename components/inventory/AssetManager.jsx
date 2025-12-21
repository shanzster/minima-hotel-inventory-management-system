'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { useAuth } from '../../hooks/useAuth'

export default function AssetManager({ assets = [], onAssetUpdate, conditionFilter = '', categoryFilter = '' }) {
  const { user } = useAuth()
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showConditionModal, setShowConditionModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState('adjustment')

  // Filter assets based on props
  const getFilteredAssets = () => {
    let filtered = [...assets]
    
    if (conditionFilter) {
      filtered = filtered.filter(asset => asset.condition === conditionFilter)
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(asset => asset.category === categoryFilter)
    }
    
    return filtered
  }

  const filteredAssets = getFilteredAssets()

  // Asset assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    assignedTo: '',
    assignedDepartment: '',
    notes: ''
  })

  // Condition update form state
  const [conditionForm, setConditionForm] = useState({
    newCondition: '',
    notes: ''
  })

  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: '',
    scheduledDate: '',
    priority: 'normal',
    notes: ''
  })

  // Adjustment form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    reason: '',
    value: '',
    notes: ''
  })

  const departments = [
    'housekeeping',
    'kitchen',
    'maintenance',
    'front-desk',
    'management'
  ]

  const conditions = [
    'excellent',
    'good',
    'fair',
    'poor'
  ]

  const maintenanceTypes = [
    'preventive',
    'corrective',
    'emergency',
    'routine'
  ]

  const priorities = [
    'low',
    'normal',
    'high',
    'critical'
  ]

  const handleAssignmentSubmit = (e) => {
    e.preventDefault()
    
    const assetAction = {
      assetId: selectedAsset.id,
      type: 'assignment',
      details: {
        assignedTo: assignmentForm.assignedTo,
        assignedDepartment: assignmentForm.assignedDepartment,
        notes: assignmentForm.notes,
        previousAssignment: selectedAsset.assignedTo
      }
    }

    onAssetUpdate?.(assetAction, user)
    
    // Reset form and close modal
    setAssignmentForm({ assignedTo: '', assignedDepartment: '', notes: '' })
    setShowAssignmentModal(false)
    setSelectedAsset(null)
  }

  const handleConditionSubmit = (e) => {
    e.preventDefault()
    
    const assetAction = {
      assetId: selectedAsset.id,
      type: 'condition-update',
      details: {
        previousCondition: selectedAsset.condition,
        newCondition: conditionForm.newCondition,
        notes: conditionForm.notes
      }
    }

    onAssetUpdate?.(assetAction, user)
    
    // Reset form and close modal
    setConditionForm({ newCondition: '', notes: '' })
    setShowConditionModal(false)
    setSelectedAsset(null)
  }

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault()
    
    const assetAction = {
      assetId: selectedAsset.id,
      type: 'maintenance-schedule',
      details: {
        maintenanceType: maintenanceForm.maintenanceType,
        scheduledDate: maintenanceForm.scheduledDate,
        priority: maintenanceForm.priority,
        notes: maintenanceForm.notes
      }
    }

    onAssetUpdate?.(assetAction, user)
    
    // Reset form and close modal
    setMaintenanceForm({ maintenanceType: '', scheduledDate: '', priority: 'normal', notes: '' })
    setShowMaintenanceModal(false)
    setSelectedAsset(null)
  }

  const handleAdjustmentSubmit = (e) => {
    e.preventDefault()
    
    const assetAction = {
      assetId: selectedAsset.id,
      type: adjustmentType,
      details: {
        reason: adjustmentForm.reason,
        value: parseFloat(adjustmentForm.value) || 0,
        notes: adjustmentForm.notes
      }
    }

    onAssetUpdate?.(assetAction, user)
    
    // Reset form and close modal
    setAdjustmentForm({ reason: '', value: '', notes: '' })
    setShowAdjustmentModal(false)
    setSelectedAsset(null)
  }

  const openAssignmentModal = (asset) => {
    setSelectedAsset(asset)
    setAssignmentForm({
      assignedTo: asset.assignedTo || '',
      assignedDepartment: asset.assignedDepartment || '',
      notes: ''
    })
    setShowAssignmentModal(true)
  }

  const openConditionModal = (asset) => {
    setSelectedAsset(asset)
    setConditionForm({
      newCondition: asset.condition || '',
      notes: ''
    })
    setShowConditionModal(true)
  }

  const openMaintenanceModal = (asset) => {
    setSelectedAsset(asset)
    setMaintenanceForm({
      maintenanceType: '',
      scheduledDate: '',
      priority: 'normal',
      notes: ''
    })
    setShowMaintenanceModal(true)
  }

  const openAdjustmentModal = (asset, type) => {
    setSelectedAsset(asset)
    setAdjustmentType(type)
    setAdjustmentForm({
      reason: '',
      value: '',
      notes: ''
    })
    setShowAdjustmentModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Asset List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {asset.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {asset.description}
                      </div>
                      {asset.serialNumber && (
                        <div className="text-xs text-gray-400">
                          S/N: {asset.serialNumber}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={asset.condition}>
                      {asset.condition}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {asset.assignedTo || 'Unassigned'}
                    </div>
                    {asset.assignedDepartment && (
                      <div className="text-sm text-gray-500">
                        {asset.assignedDepartment}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignmentModal(asset)}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openConditionModal(asset)}
                      >
                        Condition
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openMaintenanceModal(asset)}
                      >
                        Maintenance
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAdjustmentModal(asset, 'adjustment')}
                      >
                        Adjust
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAdjustmentModal(asset, 'write-off')}
                      >
                        Write-off
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        {assets.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No assets found</p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false)
          setSelectedAsset(null)
        }}
        title={`Assign Asset - ${selectedAsset?.name}`}
        size="md"
      >
        <form onSubmit={handleAssignmentSubmit} className="space-y-4">
          <Input
            label="Assigned To"
            type="text"
            value={assignmentForm.assignedTo}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignedTo: e.target.value }))}
            placeholder="Enter person or role"
            required
          />
          
          <Input
            label="Department"
            type="select"
            value={assignmentForm.assignedDepartment}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignedDepartment: e.target.value }))}
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept.charAt(0).toUpperCase() + dept.slice(1)}
              </option>
            ))}
          </Input>

          <Input
            label="Notes"
            type="textarea"
            value={assignmentForm.notes}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Assignment notes (optional)"
            rows={3}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAssignmentModal(false)
                setSelectedAsset(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Assign Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Condition Update Modal */}
      <Modal
        isOpen={showConditionModal}
        onClose={() => {
          setShowConditionModal(false)
          setSelectedAsset(null)
        }}
        title={`Update Condition - ${selectedAsset?.name}`}
        size="md"
      >
        <form onSubmit={handleConditionSubmit} className="space-y-4">
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Current Condition: <Badge variant={selectedAsset?.condition}>
                {selectedAsset?.condition}
              </Badge>
            </p>
          </div>

          <Input
            label="New Condition"
            type="select"
            value={conditionForm.newCondition}
            onChange={(e) => setConditionForm(prev => ({ ...prev, newCondition: e.target.value }))}
            required
          >
            <option value="">Select Condition</option>
            {conditions.map(condition => (
              <option key={condition} value={condition}>
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
              </option>
            ))}
          </Input>

          <Input
            label="Notes"
            type="textarea"
            value={conditionForm.notes}
            onChange={(e) => setConditionForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Condition update notes"
            rows={3}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowConditionModal(false)
                setSelectedAsset(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Condition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false)
          setSelectedAsset(null)
        }}
        title={`Schedule Maintenance - ${selectedAsset?.name}`}
        size="md"
      >
        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
          <Input
            label="Maintenance Type"
            type="select"
            value={maintenanceForm.maintenanceType}
            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, maintenanceType: e.target.value }))}
            required
          >
            <option value="">Select Type</option>
            {maintenanceTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Input>

          <Input
            label="Scheduled Date"
            type="date"
            value={maintenanceForm.scheduledDate}
            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            required
          />

          <Input
            label="Priority"
            type="select"
            value={maintenanceForm.priority}
            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, priority: e.target.value }))}
            required
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </Input>

          <Input
            label="Notes"
            type="textarea"
            value={maintenanceForm.notes}
            onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Maintenance notes"
            rows={3}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowMaintenanceModal(false)
                setSelectedAsset(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Schedule Maintenance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment/Write-off Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => {
          setShowAdjustmentModal(false)
          setSelectedAsset(null)
        }}
        title={`${adjustmentType === 'write-off' ? 'Write-off' : 'Adjust'} Asset - ${selectedAsset?.name}`}
        size="md"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
          <Input
            label="Reason"
            type="text"
            value={adjustmentForm.reason}
            onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
            placeholder={`Reason for ${adjustmentType}`}
            required
          />

          <Input
            label="Value"
            type="number"
            value={adjustmentForm.value}
            onChange={(e) => setAdjustmentForm(prev => ({ ...prev, value: e.target.value }))}
            placeholder="Asset value"
            min="0"
            step="0.01"
          />

          <Input
            label="Notes"
            type="textarea"
            value={adjustmentForm.notes}
            onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder={`${adjustmentType} notes`}
            rows={3}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAdjustmentModal(false)
                setSelectedAsset(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {adjustmentType === 'write-off' ? 'Write-off Asset' : 'Adjust Asset'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}