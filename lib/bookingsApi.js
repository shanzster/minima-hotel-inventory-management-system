import { database } from './firebase'
import {
  ref,
  get,
  set,
  push,
  onValue,
  off,
  query,
  orderByChild,
  equalTo
} from 'firebase/database'

class BookingsApi {
  constructor() {
    this.collectionName = 'bookings'
  }

  async getAll() {
    try {
      if (!database) {
        return []
      }

      const bookingsRef = ref(database, this.collectionName)
      const snapshot = await get(bookingsRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
      }

      return []
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return []
    }
  }

  async getById(id) {
    try {
      if (!database) {
        return null
      }

      const bookingRef = ref(database, `${this.collectionName}/${id}`)
      const snapshot = await get(bookingRef)

      if (snapshot.exists()) {
        return {
          id,
          ...snapshot.val()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching booking:', error)
      return null
    }
  }

  async create(bookingData) {
    try {
      if (!database) {
        throw new Error('Database not initialized')
      }

      const bookingsRef = ref(database, this.collectionName)
      const newBookingRef = push(bookingsRef)
      
      const booking = {
        ...bookingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await set(newBookingRef, booking)
      
      return {
        id: newBookingRef.key,
        ...booking
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  }

  async update(id, updates) {
    try {
      if (!database) {
        throw new Error('Database not initialized')
      }

      const bookingRef = ref(database, `${this.collectionName}/${id}`)
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await set(bookingRef, updatedData)
      
      return {
        id,
        ...updatedData
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      throw error
    }
  }

  // Real-time listener for all bookings
  onBookingsChange(callback) {
    try {
      if (!database) {
        callback([])
        return () => { }
      }

      const bookingsRef = ref(database, this.collectionName)

      const unsubscribe = onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const bookings = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }))
          callback(bookings)
        } else {
          callback([])
        }
      })

      return () => off(bookingsRef)
    } catch (error) {
      console.error('Error setting up bookings listener:', error)
      callback([])
      return () => { }
    }
  }

  // Real-time listener for checked-in bookings only
  onCheckedInBookings(callback) {
    try {
      if (!database) {
        callback([])
        return () => { }
      }

      const bookingsRef = ref(database, this.collectionName)

      const unsubscribe = onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const bookings = Object.keys(data)
            .map(key => ({
              id: key,
              ...data[key]
            }))
            .filter(booking => booking.status === 'checked-in')
          
          callback(bookings)
        } else {
          callback([])
        }
      })

      return () => off(bookingsRef)
    } catch (error) {
      console.error('Error setting up checked-in bookings listener:', error)
      callback([])
      return () => { }
    }
  }

  // Real-time listener for checked-out bookings only
  onCheckedOutBookings(callback) {
    try {
      if (!database) {
        callback([])
        return () => { }
      }

      const bookingsRef = ref(database, this.collectionName)

      const unsubscribe = onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const bookings = Object.keys(data)
            .map(key => ({
              id: key,
              ...data[key]
            }))
            .filter(booking => booking.status === 'checked-out')
          
          callback(bookings)
        } else {
          callback([])
        }
      })

      return () => off(bookingsRef)
    } catch (error) {
      console.error('Error setting up checked-out bookings listener:', error)
      callback([])
      return () => { }
    }
  }

  // Get bookings by room
  async getByRoom(roomId) {
    try {
      if (!database) {
        return []
      }

      const bookingsRef = ref(database, this.collectionName)
      const snapshot = await get(bookingsRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        return Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .filter(booking => booking.roomId === roomId)
      }

      return []
    } catch (error) {
      console.error('Error fetching bookings by room:', error)
      return []
    }
  }
}

export default new BookingsApi()
