import { useState } from 'react'
import Button from './Button'

export default function Table({ 
  data = [], 
  columns = [], 
  onRowClick, 
  sortBy, 
  sortDirection = 'asc', 
  onSort,
  pagination,
  onPageChange,
  // New props for built-in filtering
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearch,
  showFilters = false,
  filterOptions = [],
  onFilter,
  showQuickFilters = false,
  quickFilters = [],
  onQuickFilter,
  className = ''
}) {
  const [currentSortBy, setCurrentSortBy] = useState(sortBy)
  const [currentSortDirection, setCurrentSortDirection] = useState(sortDirection)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('')
  const [activeQuickFilters, setActiveQuickFilters] = useState([])
  
  // Handle column sorting
  const handleSort = (columnKey) => {
    let newDirection = 'asc'
    
    if (currentSortBy === columnKey && currentSortDirection === 'asc') {
      newDirection = 'desc'
    }
    
    setCurrentSortBy(columnKey)
    setCurrentSortDirection(newDirection)
    
    if (onSort) {
      onSort(columnKey, newDirection)
    }
  }
  
  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }
  
  // Handle filter dropdown
  const handleFilter = (e) => {
    const value = e.target.value
    setSelectedFilter(value)
    onFilter?.(value)
  }
  
  // Handle quick filters
  const handleQuickFilter = (filterKey) => {
    const newActiveFilters = activeQuickFilters.includes(filterKey)
      ? activeQuickFilters.filter(f => f !== filterKey)
      : [...activeQuickFilters, filterKey]
    
    setActiveQuickFilters(newActiveFilters)
    onQuickFilter?.(newActiveFilters)
  }
  
  // Render sort indicator
  const renderSortIndicator = (columnKey) => {
    if (currentSortBy !== columnKey) {
      return <span className="text-gray-300 ml-1">↕</span>
    }
    
    return (
      <span className="text-black ml-1">
        {currentSortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )
  }
  
  // Render table controls (search, filters, etc.)
  const renderTableControls = () => {
    if (!showSearch && !showFilters && !showQuickFilters) return null
    
    return (
      <div className="border-b border-gray-200 bg-white">
        {/* Main controls row */}
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left side - Search */}
          <div className="flex-1 max-w-md">
            {showSearch && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-4 w-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          {/* Right side - Filter dropdown */}
          <div className="flex items-center space-x-4">
            {showFilters && filterOptions.length > 0 && (
              <div className="relative">
                <select
                  value={selectedFilter}
                  onChange={handleFilter}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick filters row */}
        {showQuickFilters && quickFilters.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Quick filters:</span>
              {quickFilters.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => handleQuickFilter(filter.key)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    activeQuickFilters.includes(filter.key)
                      ? `${filter.activeClass || 'bg-blue-100 text-blue-700 border-blue-200'}`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                  {filter.count !== undefined && ` (${filter.count})`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Render pagination controls
  const renderPagination = () => {
    if (!pagination) return null
    
    const { page, pageSize, total } = pagination
    const totalPages = Math.ceil(total / pageSize)
    const startItem = (page - 1) * pageSize + 1
    const endItem = Math.min(page * pageSize, total)
    
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {startItem} to {endItem} of {total} results
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {renderTableControls()}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map(column => (
                <th 
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-200' : ''}
                  `}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && renderSortIndicator(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-12 text-center text-gray-500 font-body"
                >
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm">No data available</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr 
                  key={item.id || index}
                  className={`
                    transition-colors duration-200
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  `}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map(column => (
                    <td 
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render 
                        ? column.render(item[column.key], item)
                        : item[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {renderPagination()}
    </div>
  )
}