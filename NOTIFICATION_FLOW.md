# Check-In Notification Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONT DESK / BOOKING SYSTEM                  │
│                                                                   │
│  Guest arrives → Create/Update booking → Set status: "checked-in"│
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIREBASE REALTIME DATABASE                  │
│                                                                   │
│  bookings/                                                        │
│    └─ booking-123:                                               │
│         ├─ roomId: "room-201"                                    │
│         ├─ roomNumber: "201"                                     │
│         ├─ guestName: "John Doe"                                 │
│         ├─ status: "checked-in" ◄── TRIGGERS NOTIFICATION        │
│         ├─ checkInDate: "2026-03-09T14:00:00Z"                   │
│         └─ checkOutDate: "2026-03-12T11:00:00Z"                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Real-time listener
                             │ (onCheckedInBookings)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HOUSEKEEPING PAGE (Browser)                   │
│                                                                   │
│  1. Detect new booking with status "checked-in"                  │
│  2. Check if booking ID not in previousCheckedInBookings         │
│  3. Extract guest name and room number                           │
│  4. Send notifications                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ├─────────────────┬──────────────────┐
                             ▼                 ▼                  ▼
                    ┌────────────────┐ ┌──────────────┐ ┌────────────────┐
                    │    BROWSER     │ │   IN-APP     │ │   TRACKING     │
                    │  NOTIFICATION  │ │    TOAST     │ │                │
                    │                │ │              │ │ Add booking ID │
                    │ "New Guest     │ │ "New check-  │ │ to seen list   │
                    │  Check-In"     │ │  in: John    │ │                │
                    │                │ │  Doe - Room  │ │ Prevent        │
                    │ John Doe has   │ │  201"        │ │ duplicates     │
                    │ checked into   │ │              │ │                │
                    │ Room 201       │ │ Duration:    │ │                │
                    │                │ │ 8 seconds    │ │                │
                    │ Auto-close:    │ │              │ │                │
                    │ 10 seconds     │ │              │ │                │
                    └────────────────┘ └──────────────┘ └────────────────┘
```

---

## Detailed Step-by-Step Flow

### Phase 1: Guest Check-In (Front Desk)

```
[Front Desk Staff]
      │
      ├─► Guest arrives at hotel
      │
      ├─► Staff opens booking system
      │
      ├─► Finds guest reservation
      │
      ├─► Clicks "Check In" button
      │
      └─► System updates booking:
            {
              status: "pending" → "checked-in",
              checkInDate: "2026-03-09T14:00:00Z"
            }
```

### Phase 2: Firebase Update

```
[Firebase Realtime Database]
      │
      ├─► Receives booking update
      │
      ├─► Stores in bookings collection
      │
      └─► Triggers real-time listeners
            │
            └─► All connected clients notified
```

### Phase 3: Housekeeping Detection

```
[Housekeeping Page - Real-time Listener]
      │
      ├─► onCheckedInBookings() callback fires
      │
      ├─► Receives array of checked-in bookings
      │
      ├─► Loops through each booking
      │
      ├─► Checks: Is this booking ID new?
      │     │
      │     ├─► YES: New check-in detected!
      │     │     │
      │     │     ├─► Extract booking data
      │     │     ├─► Send notifications
      │     │     └─► Add ID to seen list
      │     │
      │     └─► NO: Already seen, skip
      │
      └─► Continue monitoring
```

### Phase 4: Notification Delivery

```
[Notification System]
      │
      ├─► Check browser notification permission
      │     │
      │     ├─► GRANTED
      │     │     │
      │     │     └─► Send browser notification
      │     │           │
      │     │           ├─► Title: "New Guest Check-In"
      │     │           ├─► Body: "John Doe has checked into Room 201"
      │     │           ├─► Icon: Hotel logo
      │     │           ├─► Auto-close: 10 seconds
      │     │           └─► Click handler: Focus window
      │     │
      │     ├─► DENIED
      │     │     │
      │     │     └─► Skip browser notification
      │     │
      │     └─► DEFAULT
      │           │
      │           └─► Skip browser notification
      │
      └─► Send in-app toast (always)
            │
            ├─► Message: "New check-in: John Doe - Room 201"
            ├─► Type: Success (green)
            ├─► Duration: 8 seconds
            └─► Position: Top-right
```

### Phase 5: Housekeeping Response

```
[Housekeeping Staff]
      │
      ├─► Sees/hears notification
      │
      ├─► Reads guest name and room number
      │
      ├─► Checks room status in system
      │
      ├─► Prepares for guest arrival
      │     │
      │     ├─► Verify room is clean
      │     ├─► Check bundle assignment
      │     └─► Ensure amenities stocked
      │
      └─► Continues monitoring for more check-ins
```

---

## State Management

### Tracking Seen Bookings

```javascript
// Using useRef to persist across renders
const previousCheckedInBookings = useRef(new Set())

// On initial load
checkedInBookings.forEach(booking => {
  previousCheckedInBookings.current.add(booking.id)
})

// On subsequent updates
checkedInBookings.forEach(booking => {
  if (!previousCheckedInBookings.current.has(booking.id)) {
    // NEW CHECK-IN!
    sendNotification(booking)
    previousCheckedInBookings.current.add(booking.id)
  }
})

// Cleanup checked-out bookings
const currentIds = new Set(checkedInBookings.map(b => b.id))
previousCheckedInBookings.current.forEach(id => {
  if (!currentIds.has(id)) {
    previousCheckedInBookings.current.delete(id)
  }
})
```

---

## Notification Permission States

### State 1: Default (Not Asked)

```
┌─────────────────────────────────────┐
│  Housekeeping Page Header           │
│                                     │
│  🔔 [Enable Notifications] ◄─ Click│
│     (Amber indicator)               │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Browser Permission Prompt          │
│                                     │
│  Allow notifications from this site?│
│                                     │
│  [Block]  [Allow]                   │
└─────────────────────────────────────┘
```

### State 2: Granted (Active)

```
┌─────────────────────────────────────┐
│  Housekeeping Page Header           │
│                                     │
│  🔔● Notifications Active           │
│     (Green indicator with pulse)    │
└─────────────────────────────────────┘
         │
         ▼
    Notifications
    will be sent
```

### State 3: Denied (Blocked)

```
┌─────────────────────────────────────┐
│  Housekeeping Page Header           │
│                                     │
│  🔔✗ Notifications Blocked          │
│     (Red indicator)                 │
└─────────────────────────────────────┘
         │
         ▼
    Only toast
    notifications
    will be sent
```

---

## Error Handling

### Scenario 1: Firebase Connection Lost

```
[Real-time Listener]
      │
      ├─► Connection lost
      │
      ├─► onValue() error callback
      │
      ├─► Log error to console
      │
      ├─► Call callback with empty array
      │
      └─► Firebase auto-reconnects
            │
            └─► Listener resumes automatically
```

### Scenario 2: Notification API Not Supported

```
[Notification Check]
      │
      ├─► Check: 'Notification' in window
      │     │
      │     ├─► TRUE: Proceed normally
      │     │
      │     └─► FALSE: Browser doesn't support
      │           │
      │           ├─► Hide notification indicator
      │           │
      │           └─► Only show toast notifications
```

### Scenario 3: Invalid Booking Data

```
[Booking Validation]
      │
      ├─► Check required fields
      │     │
      │     ├─► roomId: Present?
      │     ├─► guestName: Present?
      │     └─► status: "checked-in"?
      │
      ├─► If missing data:
      │     │
      │     ├─► Use fallback values
      │     │     │
      │     │     ├─► roomNumber: "Unknown"
      │     │     └─► guestName: "Guest"
      │     │
      │     └─► Still send notification
      │
      └─► Log warning to console
```

---

## Performance Considerations

### Efficient Listener

```
✅ Single Firebase listener
   - Not polling
   - Not repeated queries
   - Real-time updates only

✅ Memory-efficient tracking
   - Set data structure (O(1) lookup)
   - Only stores booking IDs
   - Auto-cleanup on checkout

✅ Notification optimization
   - Auto-close after 10 seconds
   - Reuses notification tag
   - No notification queue buildup
```

### Resource Usage

```
Firebase Listener:  ~1 KB/s (idle)
Memory (Set):       ~100 bytes per booking ID
Notifications:      ~5 KB per notification
Total Impact:       Minimal
```

---

## Testing Scenarios

### Test 1: Single Check-In

```
1. Open housekeeping page
2. Allow notifications
3. Create check-in via test page
4. ✓ Browser notification appears
5. ✓ Toast notification appears
6. ✓ No duplicate notifications
```

### Test 2: Multiple Check-Ins

```
1. Open housekeeping page
2. Create 3 check-ins rapidly
3. ✓ 3 separate notifications
4. ✓ Each shows correct guest/room
5. ✓ No duplicates
```

### Test 3: Blocked Notifications

```
1. Block notifications in browser
2. Open housekeeping page
3. ✓ Red "Blocked" indicator
4. Create check-in
5. ✓ Toast notification still appears
6. ✓ No browser notification
```

### Test 4: Page Reload

```
1. Open housekeeping page
2. Create check-in
3. ✓ Notification appears
4. Reload page
5. ✓ No duplicate notification
6. Create another check-in
7. ✓ New notification appears
```

---

## Integration Points

### Where to Create Check-Ins

```
Option 1: Front Desk System
  └─► Update booking status to "checked-in"

Option 2: PMS Integration
  └─► Webhook triggers booking update

Option 3: Mobile App
  └─► Guest self-check-in updates status

Option 4: Test Page (Development)
  └─► /settings/test-checkin
```

### Where Notifications Appear

```
Housekeeping Page:
  └─► /housekeeping
      ├─► Browser notification (if granted)
      ├─► Toast notification (always)
      └─► Real-time room status updates
```

---

**Status:** ✅ Fully Implemented  
**Last Updated:** March 9, 2026  
**Version:** 1.0
