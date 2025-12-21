import { useState } from 'react'

export default function FilterBar({ 
  title = "Items",
  searchQuery = '',
  onSearch, 
  selectedCategory = '',
  onCategoryFilter,
  categoryOptions = [],
  expiryFilter = '',
  onExpiryFilter,
  expiryOptions = [],
  onLocationFilter, 
  onStatusFilter,
  onSortChange,
  className = ''
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory)
  const [localExpiryFilter, setLocalExpiryFilter] = useState(expiryFilter)
  const [selectedSort, setSelectedSort] = useState('name')
  
  const handleSearch = (e) => {
    const value = e.target.value
    setLocalSearchQuery(value)
    onSearch?.(value)
  }
  
  const handleCategoryChange = (e) => {
    const value = e.target.value
    setLocalSelectedCategory(value)
    onCategoryFilter?.(value)
  }
  
  const handleExpiryFilterChange = (e) => {
    const value = e.target.value
    setLocalExpiryFilter(value)
    onExpiryFilter?.(value)
  }
  
  const handleSortChange = (e) => {
    const value = e.target.value
    setSelectedSort(value)
    onSortChange?.(value)
  }
  
  const defaultCategoryOptions = [
    { label: 'All Categories', value: '' }
  ]
  
  const finalCategoryOptions = categoryOptions.length > 0 ? categoryOptions : defaultCategoryOptions
  
  const sortOptions = [
    { label: 'Best Seller', value: 'best-seller' },
    { label: 'Name A-Z', value: 'name' },
    { label: 'Name Z-A', value: 'name-desc' },
    { label: 'Stock Level', value: 'stock' },
    { label: 'Recently Added', value: 'recent' },
    { label: 'Expiry Date', value: 'expiry' }
  ]
  
  return (
    <div className={`filter-bar bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left - Title */}
        <div className="flex-shrink-0">
          <h2 className="text-lg font-heading font-medium text-black">
            {title}
          </h2>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-md mx-8">
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
              placeholder="Search product, etc"
              value={localSearchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Right - Sort and Filter Dropdowns */}
        <div className="flex items-center space-x-4">
          {/* Expiry Filter Dropdown (if options provided) */}
          {expiryOptions.length > 0 && (
            <div className="relative">
              <select
                value={localExpiryFilter}
                onChange={handleExpiryFilterChange}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
              >
                {expiryOptions.map(option => (
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

          {/* Category Filter Dropdown */}
          <div className="relative">
            <select
              value={localSelectedCategory}
              onChange={handleCategoryChange}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
            >
              {finalCategoryOptions.map(option => (
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

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
            <div className="relative">
              <select
                value={selectedSort}
                onChange={handleSortChange}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
              >
                {sortOptions.map(option => (
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
          </div>
        </div>
      </div>
    </div>
  )
}