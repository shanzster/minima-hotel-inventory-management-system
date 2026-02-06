import { database } from './firebase'
import { 
  ref,
  get,
  onValue,
  off
} from 'firebase/database'

class RoomsApi {
  constructor() {
    this.collectionName = 'rooms'
  }

  async getAll() {
    try {
      if (!database) {
        console.warn('Firebase database not initialized, using mock data')
        return this.getMockRooms()
      }

      const roomsRef = ref(database, this.collectionName)
      const snapshot = await get(roomsRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        // Convert Firebase object to array
        const rooms = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        // Sort by room number
        return rooms.sort((a, b) => {
          const aNum = a.roomNumber.toString()
          const bNum = b.roomNumber.toString()
          return aNum.localeCompare(bNum, undefined, { numeric: true })
        })
      }
      
      return this.getMockRooms()
    } catch (error) {
      console.error('Error fetching rooms:', error)
      // Return mock data if Firebase fails
      return this.getMockRooms()
    }
  }

  async getById(id) {
    try {
      if (!database) {
        return this.getMockRooms().find(room => room.id === id) || null
      }

      const roomRef = ref(database, `${this.collectionName}/${id}`)
      const snapshot = await get(roomRef)
      
      if (snapshot.exists()) {
        return {
          id,
          ...snapshot.val()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching room:', error)
      return null
    }
  }

  // Real-time listener for rooms
  onRoomsChange(callback) {
    try {
      if (!database) {
        console.warn('Firebase database not initialized, using mock data')
        callback(this.getMockRooms())
        return () => {} // Return empty function
      }

      const roomsRef = ref(database, this.collectionName)
      
      const unsubscribe = onValue(roomsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const rooms = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }))
          // Sort by room number
          const sortedRooms = rooms.sort((a, b) => {
            const aNum = a.roomNumber.toString()
            const bNum = b.roomNumber.toString()
            return aNum.localeCompare(bNum, undefined, { numeric: true })
          })
          callback(sortedRooms)
        } else {
          callback(this.getMockRooms())
        }
      })
      
      return () => off(roomsRef)
    } catch (error) {
      console.error('Error setting up rooms listener:', error)
      callback(this.getMockRooms())
      return () => {} // Return empty function if setup fails
    }
  }

  // Mock data fallback
  getMockRooms() {
    return [
      { id: 'room-standard-102', roomNumber: '102', roomType: 'Standard', floor: 1, status: 'available' },
      { id: 'room-deluxe-201', roomNumber: '201', roomType: 'Deluxe', floor: 2, status: 'available' },
      { id: 'room-suite-301', roomNumber: '301', roomType: 'Suite', floor: 3, status: 'available' },
      { id: 'room-family-401', roomNumber: '401', roomType: 'Family', floor: 4, status: 'available' },
      { id: 'room-1769065313223-601', roomNumber: '601', roomType: 'Standard', floor: 6, status: 'available' },
      { id: 'room-1769065313222-602', roomNumber: '602', roomType: 'Standard', floor: 6, status: 'available' },
      { id: 'room-1769065313221-603', roomNumber: '603', roomType: 'Deluxe', floor: 6, status: 'available' },
      { id: 'room-1769065313220-604', roomNumber: '604', roomType: 'Deluxe', floor: 6, status: 'available' },
      { id: 'room-1769065313217-605', roomNumber: '605', roomType: 'Suite', floor: 6, status: 'available' },
      { id: 'room-1767850847281', roomNumber: 'B209', roomType: 'Business', floor: 2, status: 'available' }
    ]
  }
}

export default new RoomsApi()
