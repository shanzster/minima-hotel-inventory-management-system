import { firebaseDB } from './firebase'

const USERS_PATH = 'users'

export const usersApi = {
  // User CRUD operations
  async getAll() {
    try {
      const users = await firebaseDB.read(USERS_PATH)
      return users || []
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      return await firebaseDB.readById(USERS_PATH, id)
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  },

  async getByEmail(email) {
    try {
      const users = await this.getAll()
      return users.find(user => user.email === email)
    } catch (error) {
      console.error('Error fetching user by email:', error)
      throw error
    }
  },

  async create(userData) {
    try {
      return await firebaseDB.create(USERS_PATH, {
        ...userData,
        active: userData.active !== undefined ? userData.active : true,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  async update(id, userData) {
    try {
      return await firebaseDB.update(USERS_PATH, id, userData)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      return await firebaseDB.delete(USERS_PATH, id)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  async deactivate(id) {
    try {
      return await this.update(id, { active: false })
    } catch (error) {
      console.error('Error deactivating user:', error)
      throw error
    }
  },

  async activate(id) {
    try {
      return await this.update(id, { active: true })
    } catch (error) {
      console.error('Error activating user:', error)
      throw error
    }
  },

  async getByRole(role) {
    try {
      const users = await this.getAll()
      return users.filter(user => user.role === role)
    } catch (error) {
      console.error('Error fetching users by role:', error)
      throw error
    }
  }
}

export default usersApi
