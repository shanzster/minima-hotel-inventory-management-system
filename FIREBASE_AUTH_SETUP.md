# Firebase Authentication Setup Guide

## Overview
The system now uses Firebase Authentication for user login instead of mock credentials. This guide will help you set up users in Firebase.

## Prerequisites
1. Firebase project is configured (hotel-minima)
2. Firebase Authentication is enabled
3. Email/Password sign-in method is enabled in Firebase Console

## Enable Firebase Authentication

### Step 1: Enable Authentication in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hotel-minima`
3. Click on "Authentication" in the left sidebar
4. Click on "Get Started" if not already enabled
5. Go to "Sign-in method" tab
6. Click on "Email/Password"
7. Enable "Email/Password" toggle
8. Click "Save"

## Creating Users

### Method 1: Firebase Console (Recommended for Initial Setup)

#### Step 1: Create Firebase Auth Users
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email and password for each user
4. Click "Add user"

**Create these users**:
- `admin@minima.com` - Password: `Admin123!`
- `controller@minima.com` - Password: `Controller123!`
- `kitchen@minima.com` - Password: `Kitchen123!`
- `purchasing@minima.com` - Password: `Purchasing123!`
- `housekeeping@minima.com` - Password: `Housekeeping123!`

#### Step 2: Add User Data to Realtime Database
After creating Firebase Auth users, you need to add their profile data to the database.

1. Go to Firebase Console → Realtime Database
2. Navigate to the root
3. Create a `users` node if it doesn't exist
4. For each user, add their data using their Firebase UID as the key

**User Data Structure**:
```json
{
  "users": {
    "firebase_uid_here": {
      "id": "firebase_uid_here",
      "email": "admin@minima.com",
      "name": "Admin User",
      "role": "admin",
      "department": "Management",
      "active": true,
      "createdAt": "2026-03-07T00:00:00Z"
    },
    "another_firebase_uid": {
      "id": "another_firebase_uid",
      "email": "controller@minima.com",
      "name": "Mark Trinidad",
      "role": "inventory-controller",
      "department": "Inventory",
      "active": true,
      "createdAt": "2026-03-07T00:00:00Z"
    }
  }
}
```

**Complete User Profiles**:

1. **Admin User**
```json
{
  "id": "FIREBASE_UID",
  "email": "admin@minima.com",
  "name": "Admin User",
  "role": "admin",
  "department": "Management",
  "active": true,
  "createdAt": "2026-03-07T00:00:00Z"
}
```

2. **Inventory Controller**
```json
{
  "id": "FIREBASE_UID",
  "email": "controller@minima.com",
  "name": "Mark Trinidad",
  "role": "inventory-controller",
  "department": "Inventory",
  "active": true,
  "createdAt": "2026-03-07T00:00:00Z"
}
```

3. **Kitchen Staff**
```json
{
  "id": "FIREBASE_UID",
  "email": "kitchen@minima.com",
  "name": "Sarah Kitchen",
  "role": "kitchen-staff",
  "department": "Kitchen",
  "active": true,
  "createdAt": "2026-03-07T00:00:00Z"
}
```

4. **Purchasing Officer**
```json
{
  "id": "FIREBASE_UID",
  "email": "purchasing@minima.com",
  "name": "Mike Purchasing",
  "role": "purchasing-officer",
  "department": "Purchasing",
  "active": true,
  "createdAt": "2026-03-07T00:00:00Z"
}
```

5. **Housekeeping Staff**
```json
{
  "id": "FIREBASE_UID",
  "email": "housekeeping@minima.com",
  "name": "Maria Santos",
  "role": "housekeeping",
  "department": "Housekeeping",
  "active": true,
  "createdAt": "2026-03-07T00:00:00Z"
}
```

### Method 2: Using Firebase Admin SDK (For Bulk User Creation)

If you need to create many users, you can use the Firebase Admin SDK with Node.js:

```javascript
// createUsers.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hotel-minima-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const users = [
  {
    email: 'admin@minima.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin',
    department: 'Management'
  },
  {
    email: 'controller@minima.com',
    password: 'Controller123!',
    name: 'Mark Trinidad',
    role: 'inventory-controller',
    department: 'Inventory'
  },
  {
    email: 'kitchen@minima.com',
    password: 'Kitchen123!',
    name: 'Sarah Kitchen',
    role: 'kitchen-staff',
    department: 'Kitchen'
  },
  {
    email: 'purchasing@minima.com',
    password: 'Purchasing123!',
    name: 'Mike Purchasing',
    role: 'purchasing-officer',
    department: 'Purchasing'
  },
  {
    email: 'housekeeping@minima.com',
    password: 'Housekeeping123!',
    name: 'Maria Santos',
    role: 'housekeeping',
    department: 'Housekeeping'
  }
];

async function createUsers() {
  const db = admin.database();
  
  for (const userData of users) {
    try {
      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name
      });
      
      console.log(`Created auth user: ${userData.email} (UID: ${userRecord.uid})`);
      
      // Add user data to database
      await db.ref(`users/${userRecord.uid}`).set({
        id: userRecord.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        active: true,
        createdAt: new Date().toISOString()
      });
      
      console.log(`Added user data for: ${userData.email}`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('All users created successfully!');
  process.exit(0);
}

createUsers();
```

To run this script:
1. Download your Firebase service account key from Firebase Console → Project Settings → Service Accounts
2. Save it as `serviceAccountKey.json`
3. Install Firebase Admin SDK: `npm install firebase-admin`
4. Run: `node createUsers.js`

## User Roles and Permissions

### Admin
- Full access to all modules
- Can manage users, bundles, inventory, purchasing, kitchen, housekeeping

### Inventory Controller
- Full access to inventory management
- Can manage purchase orders, suppliers, assets, audits
- Can manage bundles and assign them to rooms

### Kitchen Staff
- Access to kitchen module
- Can view and manage menu items
- Read-only access to inventory

### Purchasing Officer
- Access to purchasing module
- Can manage purchase orders and suppliers
- Can manage deliveries
- Read-only access to inventory

### Housekeeping
- **LIMITED ACCESS** - Only housekeeping module
- Can view rooms with bundles
- Can perform inspections and record consumed items
- Cannot access inventory, purchasing, kitchen, or admin modules

## Login Flow

1. User enters email and password
2. System authenticates with Firebase Auth
3. System fetches user profile from `users/{uid}` in database
4. System checks if user is active
5. User is redirected based on role:
   - `admin` → `/dashboard`
   - `inventory-controller` → `/dashboard`
   - `kitchen-staff` → `/dashboard/kitchen`
   - `purchasing-officer` → `/dashboard/purchasing`
   - `housekeeping` → `/housekeeping`

## Security Rules

Update your Firebase Realtime Database rules to secure user data:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    "bundles": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'inventory-controller')"
    },
    "room_bundle_assignments": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'inventory-controller')"
    },
    "room_bundle_status": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "inspection_records": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'housekeeping' || root.child('users').child(auth.uid).child('role').val() === 'admin')"
    }
  }
}
```

## Testing

### Test Login
1. Go to login page: `http://localhost:3000/login`
2. Enter email: `housekeeping@minima.com`
3. Enter password: `Housekeeping123!`
4. Click "Sign In"
5. Should redirect to `/housekeeping`
6. Verify only housekeeping module is accessible

### Test Different Roles
Repeat the above steps with different user accounts to verify role-based access control.

## Troubleshooting

### Error: "Firebase Auth is not initialized"
- Check that Firebase is properly configured in `.env.local`
- Verify Firebase config in `lib/firebase.js`

### Error: "User data not found in database"
- User exists in Firebase Auth but not in Realtime Database
- Add user profile data to `users/{uid}` node

### Error: "This account has been deactivated"
- User's `active` field is set to `false`
- Update user data in database: `active: true`

### Error: "No account found with this email address"
- User doesn't exist in Firebase Auth
- Create user in Firebase Console → Authentication

### Error: "Incorrect password"
- Password is wrong
- Reset password in Firebase Console or use "Forgot Password" feature

## Next Steps

1. ✅ Enable Firebase Authentication
2. ✅ Create initial users in Firebase Console
3. ✅ Add user profile data to Realtime Database
4. ✅ Test login with different roles
5. ⏳ Implement password reset functionality
6. ⏳ Add user management UI for admins
7. ⏳ Implement email verification
8. ⏳ Add two-factor authentication (optional)
