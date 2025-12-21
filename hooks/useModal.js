// useModal hook - will be implemented in subsequent tasks
import { useState } from 'react'

export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const toggleModal = () => setIsOpen(!isOpen)
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  }
}