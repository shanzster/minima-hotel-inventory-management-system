# Supplier Performance Tracking System

## Overview
The system automatically tracks and calculates supplier performance metrics based on delivery history. This helps identify reliable suppliers and make informed purchasing decisions.

## How It Works

### Automatic Tracking
When you receive a purchase order delivery through the "Receive Delivery" modal:

1. **Delivery Timing Analysis**
   - Compares actual delivery date with expected delivery date
   - Marks delivery as "on-time" if received on or before expected date
   - Marks as "late" if received after expected date

2. **Quality Assessment**
   - Automatically detects quality issues based on quantity discrepancies
   - If received quantity differs from ordered quantity, it's flagged as a quality issue

3. **Metrics Update**
   - Updates supplier's performance metrics in real-time
   - All calculations happen automatically in the background

## Performance Metrics

### Key Metrics Tracked

1. **Overall Rating** (0-5.0 scale)
   - Automatically calculated based on delivery reliability
   - Formula: (Delivery Reliability / 20)
   - Examples:
     - 100% reliability = 5.0 rating
     - 90% reliability = 4.5 rating
     - 80% reliability = 4.0 rating
     - 70% reliability = 3.5 rating

2. **Delivery Reliability** (0-100%)
   - Percentage of deliveries received on time
   - Formula: (On-Time Deliveries / Total Orders) × 100
   - Updates with each delivery

3. **Total Orders**
   - Count of all purchase orders received from this supplier
   - Increments with each delivery

4. **On-Time Deliveries**
   - Count of deliveries received on or before expected date
   - Used to calculate delivery reliability

5. **Quality Issues**
   - Count of deliveries with quantity discrepancies
   - Helps identify suppliers with accuracy problems

6. **Last Evaluation Date**
   - Timestamp of most recent performance update
   - Shows when metrics were last calculated

## Supplier Classifications

### High Performing Suppliers
- Overall Rating: 4.5 or higher
- Delivery Reliability: 90% or higher
- Minimal quality issues
- **Benefits**: Prioritized in supplier selection, trusted for critical orders

### Standard Suppliers
- Overall Rating: 3.5 to 4.4
- Delivery Reliability: 70-89%
- Occasional quality issues
- **Status**: Acceptable for regular orders

### Low Performing Suppliers
- Overall Rating: Below 3.5
- Delivery Reliability: Below 70%
- Frequent quality issues or late deliveries
- **Action**: Review relationship, consider alternatives

## Where to View Performance

### 1. Suppliers List Page
- Shows overall rating and delivery reliability percentage
- Color-coded ratings:
  - Green (4.5+): Excellent
  - Blue (4.0-4.4): Good
  - Yellow (3.5-3.9): Fair
  - Red (<3.5): Poor

### 2. Supplier Details Modal
- Complete performance breakdown
- Shows all metrics with visual indicators
- Displays last evaluation date
- Shows on-time delivery ratio (e.g., "23/24")
- Quality issues count

### 3. Purchase Order Creation
- Performance data helps inform supplier selection
- High-performing suppliers can be prioritized

## Implementation Details

### Files Modified
- `lib/supplierApi.js` - Added `updatePerformanceMetrics()` function
- `components/inventory/ReceivePOModal.jsx` - Calls performance update on delivery receipt
- `components/inventory/SupplierDetailsModal.jsx` - Enhanced performance display

### Data Structure
```javascript
performanceMetrics: {
  overallRating: 4.5,           // 0-5.0 scale
  deliveryReliability: 90,      // 0-100 percentage
  qualityRating: 4.8,           // 0-5.0 scale (future use)
  responseTime: 2,              // Hours (future use)
  totalOrders: 24,              // Count
  onTimeDeliveries: 23,         // Count
  qualityIssues: 1,             // Count
  lastEvaluationDate: "2024-01-15T10:30:00Z"
}
```

## Usage Tips

1. **First Deliveries**: New suppliers start with 0 ratings until first delivery is received
2. **Performance Trends**: Monitor metrics over time to identify improving or declining suppliers
3. **Quality Issues**: Investigate suppliers with high quality issue counts
4. **Late Deliveries**: Consider alternative suppliers if delivery reliability drops below 80%
5. **Automatic Updates**: No manual intervention needed - metrics update automatically

## Future Enhancements

Potential additions to the performance tracking system:
- Response time tracking (time from PO creation to acknowledgment)
- Manual quality rating input during delivery receipt
- Performance trend charts and analytics
- Automated alerts for declining performance
- Supplier performance reports and comparisons
- Weighted scoring based on order value or criticality
