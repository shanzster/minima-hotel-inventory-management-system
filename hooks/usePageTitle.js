import { createContext, useContext, useState } from 'react'

const PageTitleContext = createContext()

export function PageTitleProvider({ children }) {
  const [title, setTitle] = useState('Dashboard')
  
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  const context = useContext(PageTitleContext)
  if (!context) {
    throw new Error('usePageTitle must be used within a PageTitleProvider')
  }
  return context
}