// Audit API using Firebase Realtime Database
import firebaseDB, { database } from './firebase'
import { mockAudits } from './mockData'

// Check if Firebase is properly configured
const useFirebase = database !== null

export const auditApi = {
    // Get all audits
    async getAll() {
        if (!useFirebase) {
            return Promise.resolve([])
        }

        try {
            const audits = await firebaseDB.read('audits')
            return audits || []
        } catch (error) {
            return []
        }
    },

    // Get audit by ID
    async getById(id) {
        if (!useFirebase) {
            return Promise.resolve(null)
        }

        try {
            return await firebaseDB.readById('audits', id)
        } catch (error) {
            console.error('Error fetching audit:', error)
            return null
        }
    },

    // Create new audit
    async create(auditData) {
        if (!useFirebase) {
            const newAudit = {
                ...auditData,
                id: `mock-audit-${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
            return newAudit
        }

        try {
            const newAudit = await firebaseDB.create('audits', {
                ...auditData,
                status: auditData.status || 'in-progress'
            })

            await firebaseDB.logActivity({
                type: 'CREATE_AUDIT',
                auditId: newAudit.id,
                details: `Audit ${newAudit.auditNumber} created`,
                userRole: 'inventory-controller'
            })

            return newAudit
        } catch (error) {
            console.error('Error creating audit:', error)
            throw error
        }
    },

    // Update audit
    async update(id, auditData) {
        if (!useFirebase) {
            return { id, ...auditData }
        }

        try {
            const result = await firebaseDB.update('audits', id, auditData)

            await firebaseDB.logActivity({
                type: 'UPDATE_AUDIT',
                auditId: id,
                details: `Audit ${auditData.auditNumber || id} updated`,
                userRole: 'inventory-controller'
            })

            return result
        } catch (error) {
            console.error('Error updating audit:', error)
            throw error
        }
    },

    // Real-time listener for audits
    onAuditsChange(callback) {
        if (!useFirebase) {
            return () => { }
        }
        return firebaseDB.onValue('audits', callback)
    }
}

export default auditApi
