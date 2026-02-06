import { useState } from 'react'
import Table from '../ui/Table'
import StockIndicator from './StockIndicator'
import Badge from '../ui/Badge'

export default function InventoryTable({
  data = [],
  columns = [],
  onRowClick,
  sortBy,
  sortDirection = 'asc',
  onSort,
  pagination,
  onPageChange,
  emptyStateMessage,
  className = ''
}) {
  // Enhanced columns with inventory-specific renderers
  const enhancedColumns = columns.map(column => {
    if (column.key === 'stockLevel' && !column.render) {
      return {
        ...column,
        render: (value, item) => (
          <StockIndicator
            currentStock={item.currentStock}
            restockThreshold={item.restockThreshold}
            maxStock={item.maxStock}
            showLabel={true}
          />
        )
      }
    }
    
    if (column.key === 'status' && !column.render) {
      return {
        ...column,
        render: (value) => (
          <Badge variant={value}>
            {value}
          </Badge>
        )
      }
    }
    
    if (column.key === 'expirationDate' && !column.render) {
      return {
        ...column,
        render: (value) => {
          if (!value) return '-'
          
          const date = new Date(value)
          const now = new Date()
          const daysUntilExpiry = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
          
          let className = 'text-black'
          if (daysUntilExpiry <= 0) {
            className = 'text-red-600 font-medium'
          } else if (daysUntilExpiry <= 7) {
            className = 'text-orange-600 font-medium'
          } else if (daysUntilExpiry <= 30) {
            className = 'text-yellow-600'
          }
          
          return (
            <span className={className}>
              {date.toLocaleDateString()}
              {daysUntilExpiry <= 30 && (
                <span className="block text-xs text-gray-500">
                  {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days`}
                </span>
              )}
            </span>
          )
        }
      }
    }
    
    return column
  })
  
  return (
    <div className={`inventory-table ${className}`}>
      <Table
        data={data}
        columns={enhancedColumns}
        onRowClick={onRowClick}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={onSort}
        pagination={pagination}
        onPageChange={onPageChange}
        emptyStateMessage={emptyStateMessage}
      />
    </div>
  )
}