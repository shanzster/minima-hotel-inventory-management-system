// Kitchen API using Firebase Realtime Database
import firebaseDB, { database } from './firebase'

// Check if Firebase is properly configured
const useFirebase = database !== null

export const kitchenApi = {
    // PREP LISTS
    async getPrepLists() {
        if (!useFirebase) return []
        try {
            const lists = await firebaseDB.read('prepLists')
            return lists ? Object.values(lists) : []
        } catch (error) {
            console.error('Error fetching prep lists:', error)
            return []
        }
    },

    async savePrepList(listData) {
        if (!useFirebase) return listData
        try {
            return await firebaseDB.create('prepLists', {
                ...listData,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error saving prep list:', error)
            throw error
        }
    },

    async updatePrepTask(listId, taskIndex, status) {
        if (!useFirebase) return
        try {
            const list = await firebaseDB.readById('prepLists', listId)
            if (list && list.tasks) {
                list.tasks[taskIndex].status = status
                return await firebaseDB.update('prepLists', listId, list)
            }
        } catch (error) {
            console.error('Error updating prep task:', error)
            throw error
        }
    },

    // KITCHEN WASTE
    async logWaste(wasteData) {
        if (!useFirebase) return wasteData
        try {
            const loggedWaste = await firebaseDB.create('kitchenWaste', {
                ...wasteData,
                timestamp: new Date().toISOString()
            })

            // Also log to activity
            await firebaseDB.logActivity({
                type: 'KITCHEN_WASTE',
                details: `Logged ${wasteData.quantity} ${wasteData.unit} of ${wasteData.itemName} as waste`,
                userRole: 'kitchen-staff'
            })

            return loggedWaste
        } catch (error) {
            console.error('Error logging waste:', error)
            throw error
        }
    },

    // SHIFT REPORTS
    async saveShiftReport(reportData) {
        if (!useFirebase) return reportData
        try {
            return await firebaseDB.create('shiftReports', {
                ...reportData,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error saving shift report:', error)
            throw error
        }
    },

    // Real-time listener for prep lists
    onPrepListsChange(callback) {
        if (!useFirebase) return () => { }
        return firebaseDB.onValue('prepLists', (data) => {
            callback(data ? Object.values(data) : [])
        })
    }
}

export default kitchenApi
