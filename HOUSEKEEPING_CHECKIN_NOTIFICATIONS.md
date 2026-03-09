# Housekeeping Check-In Notifications

## Overview
Real-time browser notifications for housekeeping staff when guests check into rooms. The system monitors the bookings collection and sends instant notifications when new check-ins occur.

---

## Features

### 1. Real-Time Check-In Monitoring
- Listens to Firebase `bookings` collection in real-time
- Filters for bookings with `status === 'checked-in'`
- Detects new check-ins instantly
- Tracks previously seen bookings to avoid duplicate notifications

### 2. Browser Notifications
- Native browser notification API
- Shows guest name and room number
- Auto-closes after 10 seconds
- Click notification to focus the window
- Notification permission requested on page load

### 3. In-App Toast Notifications
- Fallback toast notification shown alongside browser notification
- Displays for 8 seconds
- Shows guest name and room number
- Works even if browser notifications are blocked

### 4. Notification Status Indicator
- Visual indicator in the header showing notification status
- Three states:
  - **Active (Green)**: Notifications enabled and working
  - **Blocked (Red)**: User denied notification permission
  - **Pending (Amber)**: Permission not yet granted, with enable button

---

## Implementation Details

### Files Created/Modified

#### New Files:
1. **`lib/bookingsApi.js`**
   - Complete bookings API with CRUD operations
   - Real-time listeners for all bookings
   - Specialized listener for checked-in bookings only
   - Room-based booking queries

#### Modified Files:
1. **`app/(protected)/housekeeping/page.jsx`**
   - Added bookingsApi import
   - Added notification permission state
   - Added previousCheckedInBookings ref to track seen bookings
   - Added notification permission request on mount
   - Added real-time check-in listener with notification logic
   - Added notification status indicator in header

---

## Data Structure

### Booking Object
```javascript
{
  id: "booking-123",
  roomId: "room-201",
  roomNumber: "201",
  guestName: "John Doe",
  status: "checked-in", // or "pending", "checked-out", "cancelled"
  checkInDate: "2026-03-09T14:00:00Z",
  checkOutDate: "2026-03-12T11:00:00Z",
  createdAt: "2026-03-09T10:00:00Z",
  updatedAt: "2026-03-09T14:00:00Z"
}
```

### Booking Statuses
- `pending`: Reservation made, not yet checked in
- `checked-in`: Guest has checked in (triggers notification)
- `checked-out`: Guest has checked out
- `cancelled`: Booking was cancelled

---

## How It Works

### 1. Initial Setup
```javascript
// Request notification permission on page load
useEffect(() => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }
}, [])
```

### 2. Real-Time Listener
```javascript
// Listen for checked-in bookings
useEffect(() => {
  const unsubscribe = bookingsApi.onCheckedInBookings((checkedInBookings) => {
    // Check for new check-ins
    checkedInBookings.forEach(booking => {
      if (!previousCheckedInBookings.current.has(booking.id)) {
        // New check-in detected - send notification
        sendNotification(booking)
      }
    })
  })
  
  return () => unsubscribe()
}, [rooms])
```

### 3. Notification Logic
```javascript
// Browser notification
if (Notification.permission === 'granted') {
  new Notification('New Guest Check-In', {
    body: `${guestName} has checked into Room ${roomNumber}`,
    icon: '/icon-192x192.png',
    tag: `checkin-${booking.id}`,
    requireInteraction: false
  })
}

// In-app toast (always shown)
toast.success(`New check-in: ${guestName} - Room ${roomNumber}`)
```

---

## User Experience

### For Housekeeping Staff

#### First Time Use:
1. Navigate to Housekeeping page
2. Browser prompts for notification permission
3. Click "Allow" to enable notifications
4. Green indicator shows "Notifications Active"

#### When Guest Checks In:
1. Browser notification appears (if permission granted)
2. Shows: "New Guest Check-In"
3. Body: "John Doe has checked into Room 201"
4. Toast notification also appears in app
5. Notification auto-closes after 10 seconds

#### If Notifications Blocked:
1. Red indicator shows "Notifications Blocked"
2. Still receive in-app toast notifications
3. Can re-enable in browser settings

#### If Permission Not Granted:
1. Amber indicator shows "Enable Notifications" button
2. Click button to request permission again
3. Still receive in-app toast notifications

---

## Browser Compatibility

### Supported Browsers:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile iOS 16.4+)
- ✅ Opera

### Notification Features:
- Desktop: Full notification support with icon, badge, actions
- Mobile: System notifications with sound/vibration
- PWA: Works as installed app notifications

---

## API Reference

### BookingsApi Methods

#### `getAll()`
Get all bookings from Firebase.
```javascript
const bookings = await bookingsApi.getAll()
```

#### `getById(id)`
Get a specific booking by ID.
```javascript
const booking = await bookingsApi.getById('booking-123')
```

#### `create(bookingData)`
Create a new booking.
```javascript
const newBooking = await bookingsApi.create({
  roomId: 'room-201',
  roomNumber: '201',
  guestName: 'John Doe',
  status: 'pending',
  checkInDate: '2026-03-09T14:00:00Z',
  checkOutDate: '2026-03-12T11:00:00Z'
})
```

#### `update(id, updates)`
Update an existing booking.
```javascript
await bookingsApi.update('booking-123', {
  status: 'checked-in'
})
```

#### `onBookingsChange(callback)`
Real-time listener for all bookings.
```javascript
const unsubscribe = bookingsApi.onBookingsChange((bookings) => {
  console.log('All bookings:', bookings)
})
// Clean up
unsubscribe()
```

#### `onCheckedInBookings(callback)`
Real-time listener for checked-in bookings only.
```javascript
const unsubscribe = bookingsApi.onCheckedInBookings((checkedInBookings) => {
  console.log('Checked-in guests:', checkedInBookings)
})
// Clean up
unsubscribe()
```

#### `getByRoom(roomId)`
Get all bookings for a specific room.
```javascript
const roomBookings = await bookingsApi.getByRoom('room-201')
```

---

## Testing

### Manual Testing Steps:

1. **Test Notification Permission:**
   - Open housekeeping page
   - Verify permission prompt appears
   - Grant permission
   - Verify green "Notifications Active" indicator

2. **Test Check-In Notification:**
   - Create a booking in Firebase with `status: 'pending'`
   - Update booking to `status: 'checked-in'`
   - Verify browser notification appears
   - Verify toast notification appears
   - Verify notification shows correct guest name and room number

3. **Test Blocked Notifications:**
   - Block notifications in browser settings
   - Reload housekeeping page
   - Verify red "Notifications Blocked" indicator
   - Create check-in
   - Verify toast notification still appears

4. **Test Multiple Check-Ins:**
   - Create multiple bookings
   - Update all to `checked-in` status
   - Verify separate notification for each
   - Verify no duplicate notifications

### Firebase Console Testing:
```javascript
// In Firebase Console, add to bookings collection:
{
  "booking-test-1": {
    "roomId": "room-201",
    "roomNumber": "201",
    "guestName": "Test Guest",
    "status": "checked-in",
    "checkInDate": "2026-03-09T14:00:00Z",
    "checkOutDate": "2026-03-12T11:00:00Z",
    "createdAt": "2026-03-09T10:00:00Z",
    "updatedAt": "2026-03-09T14:00:00Z"
  }
}
```

---

## Troubleshooting

### Notifications Not Appearing

**Check 1: Browser Permission**
- Open browser settings
- Check notification permissions for your site
- Ensure notifications are allowed

**Check 2: Browser Support**
- Verify browser supports Notification API
- Check console for errors
- Try different browser

**Check 3: Firebase Connection**
- Verify Firebase is connected
- Check browser console for Firebase errors
- Verify bookings collection exists

**Check 4: Booking Status**
- Ensure booking has `status: 'checked-in'`
- Verify booking has required fields (roomId, guestName)
- Check Firebase console for booking data

### Duplicate Notifications

**Solution:**
- The system tracks seen bookings using `previousCheckedInBookings` ref
- If duplicates occur, check that booking IDs are unique
- Verify listener cleanup is working properly

### Notifications Not Auto-Closing

**Solution:**
- Notifications auto-close after 10 seconds
- Some browsers may require user interaction
- Check browser notification settings

---

## Future Enhancements

### Potential Improvements:
1. **Notification Grouping**: Group multiple check-ins into single notification
2. **Sound Customization**: Allow custom notification sounds
3. **Priority Levels**: Different notification styles for VIP guests
4. **Notification History**: Log of all notifications received
5. **Do Not Disturb**: Quiet hours for notifications
6. **Desktop App**: Electron app for always-on notifications
7. **SMS Integration**: Send SMS for critical notifications
8. **Notification Actions**: Quick actions in notification (e.g., "View Room")

---

## Security Considerations

### Notification Content:
- Only shows guest name and room number
- No sensitive information (payment, contact details)
- Notifications auto-close to prevent screen exposure

### Permission Handling:
- Graceful degradation if permission denied
- Toast notifications as fallback
- No functionality blocked if notifications disabled

### Data Privacy:
- Notifications only sent to authenticated housekeeping staff
- Real-time listener requires active session
- No notification storage or logging

---

## Performance

### Optimization:
- Uses Firebase real-time listeners (efficient)
- Tracks seen bookings in memory (no database queries)
- Notifications auto-close to prevent memory buildup
- Listener cleanup on component unmount

### Resource Usage:
- Minimal: Single Firebase listener
- No polling or repeated queries
- Efficient notification API usage

---

## Deployment Notes

### Requirements:
- Firebase Realtime Database enabled
- Bookings collection in Firebase
- HTTPS (required for Notification API)
- Modern browser with Notification API support

### Configuration:
- No environment variables needed
- No additional dependencies
- Works with existing Firebase setup

### Rollout:
1. Deploy bookingsApi.js
2. Deploy updated housekeeping page
3. Test with sample booking
4. Train housekeeping staff on notification feature
5. Monitor for issues

---

**Implementation Date:** March 9, 2026  
**Status:** Production Ready ✅  
**Browser Support:** Chrome, Firefox, Safari, Edge  
**Mobile Support:** iOS 16.4+, Android Chrome
