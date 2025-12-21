import Badge from '../ui/Badge'
import { calculateStockStatus } from '../../lib/utils'

export default function StockIndicator({ 
  currentStock = 0, 
  restockThreshold = 0, 
  maxStock, 
  showLabel = true,
  showBar = false,
  className = ''
}) {
  const status = calculateStockStatus(currentStock, restockThreshold, maxStock)
  
  const getStatusText = () => {
    switch (status) {
      case 'critical': return 'Critical'
      case 'low': return 'Low Stock'
      case 'excess': return 'Excess'
      case 'normal': return 'Normal'
      default: return 'Normal'
    }
  }
  
  const getBarWidth = () => {
    const maxValue = maxStock || (restockThreshold * 3) || 100
    return Math.min((currentStock / maxValue) * 100, 100)
  }
  
  const getBarColor = () => {
    switch (status) {
      case 'critical': return 'bg-gray-700'
      case 'low': return 'bg-gray-500'
      case 'excess': return 'bg-gray-500'
      case 'normal': return 'bg-gray-900'
      default: return 'bg-gray-300'
    }
  }
  
  return (
    <div className={`stock-indicator flex items-center space-x-2 ${className}`}>
      {showBar && (
        <div className="stock-bar w-16 h-2 bg-gray-200 rounded-sm overflow-hidden">
          <div 
            className={`stock-fill h-full transition-all duration-300 ease-out ${getBarColor()}`}
            style={{ width: `${getBarWidth()}%` }}
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Badge variant={status}>
          {getStatusText()}
        </Badge>
        
        {showLabel && (
          <span className="stock-label text-sm font-body text-black">
            {currentStock}
            {restockThreshold > 0 && (
              <span className="text-gray-500 ml-1">
                / {restockThreshold} min
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}