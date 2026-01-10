# Nexus Staff Portal - Implementation Guide

## Overview

The Nexus Staff Portal is a complete, secure, role-based staff management system for the MSC Initiative. This implementation provides a professional, modern interface for managing staff, files, roles, and system operations.

## What Was Implemented

### 📄 Pages (6 Total)

1. **Login Page** (`/nexus/login.html`)
   - Email/password authentication
   - Firebase Auth integration
   - Branded login screen with feature highlights
   - Responsive design

2. **Signup Page** (`/nexus/signup.html`)
   - User registration with full name, email, password
   - Dynamic secondary email addition
   - Role selection (non-admin roles only)
   - Creates user in Firebase Auth and Firestore

3. **Dashboard** (`/nexus/dashboard.html`)
   - Welcome section with user greeting
   - Role chips display
   - Quick access cards
   - Recent files section
   - Admin-only tools section
   - Add secondary email modal

4. **Roles Manager** (`/nexus/roles.html`) - **Admin Only**
   - Three tabs: Roles, User Management, Activity Log
   - Create, edit, delete roles
   - Assign/remove roles from users
   - Manage secondary emails
   - View activity logs
   - Search users
   - Default roles initialization

5. **Files Manager** (`/nexus/files.html`)
   - Folder tree navigation
   - File grid display
   - Breadcrumb navigation
   - Admin features:
     - Create folders
     - Upload files (with drag-and-drop)
     - Rename files/folders
     - Delete files/folders
   - File preview/download
   - Activity logging

6. **Settings** (`/nexus/settings.html`) - **Admin Only**
   - System overview with stats
   - Role configuration summary
   - Activity logs (all, roles, files)
   - Configuration placeholders

### 🎨 Styling (7 CSS Files)

- **shared.css**: Common layout, sidebar, navbar, modals, forms, buttons
- **login.css**: Login page specific styles
- **signup.css**: Signup page specific styles
- **dashboard.css**: Dashboard layout and cards
- **roles.css**: Roles management interface
- **files.css**: File manager grid and tree
- **settings.css**: Settings page stats and logs

### ⚙️ JavaScript (8 Files)

1. **firebase.js**: Firebase initialization, auth helpers, user management
2. **supabase.js**: Supabase client, storage operations
3. **firebaseFunctions.js**: Cloud Functions wrappers, activity logging
4. **login.js**: Login form handling
5. **signup.js**: Signup form with dynamic email fields
6. **dashboard.js**: Dashboard data loading, user info display
7. **roles.js**: Complete role management, user assignment
8. **files.js**: File operations, drag-and-drop, folder navigation
9. **settings.js**: System stats, logs display

### ☁️ Firebase Cloud Functions (7 Functions)

Located in `/functions/index.js`:

1. **createRole**: Create new roles with permissions
2. **updateRole**: Modify existing roles
3. **deleteRole**: Remove roles from system
4. **assignUserRole**: Add role to user
5. **removeUserRole**: Remove role from user
6. **addSecondaryEmail**: Add secondary email to user
7. **removeSecondaryEmail**: Remove secondary email from user

All functions include:

- Input validation
- Error handling
- Activity logging

## Default Roles

The system includes 8 default roles:

### Admin Roles
- **Global - Initiative Director**: Full system access
- **Global - Deputy Initiative Director**: Full system access

### Standard Roles
- **HAPU - School Lead**: School program leader
- **HAPU - Deputy School Lead**: Assistant school leader
- **HAPU - Core Team**: Core team member
- **HAPU - Support Team**: Support team member
- **HAPU - Staff**: General staff
- **HAPU - Staff Coordinator**: Staff coordinator

## Architecture

### Authentication Flow
1. User signs up with email/password → Firebase Auth
2. User document created in Firestore `/users/{uid}`
3. User assigned default role
4. Login redirects to dashboard
5. Role-based navigation guards on all pages

### Role-Based Access Control

**Admin Privileges** (Initiative Director & Deputy Director):
- Full access to Roles page
- Full access to Settings page
- Create/upload/modify/delete files
- Manage all users and roles
- View all activity logs

**Non-Admin Access**:
- View dashboard
- View files (read-only)
- Cannot access Roles or Settings pages
- Cannot modify files

### Data Structure

**Firestore Collections**:
```
/users/{uid}
  - fullName
  - primaryEmail
  - secondaryEmails: []
  - roles: []
  - createdAt
  - updatedAt

/roles/{roleId}
  - name
  - description
  - isAdmin: boolean
  - permissions: {}
  - createdAt
  - updatedAt

/systemLogs/{logId}
  - type: 'roles' | 'files'
  - action
  - details
  - userId
  - userName
  - timestamp
```

**Supabase Storage**:
```
msc-nexus/
  ├── folder1/
  │   ├── file1.pdf
  │   └── subfolder/
  │       └── file2.doc
  └── folder2/
      └── file3.xlsx
```

## Features Implemented

### ✅ Core Features
- Email/password authentication
- User registration with role selection
- Role-based dashboard
- Admin-only pages with access control
- Responsive mobile-first design

### ✅ Role Management
- CRUD operations for roles
- Default roles initialization
- Role assignment to users
- Permission flags per role
- Admin role detection

### ✅ User Management
- View all users
- Search users by name/email
- View user details
- Manage user roles
- Add/remove secondary emails
- User activity tracking

### ✅ File Management
- Folder tree navigation
- File grid display
- Create folders
- Upload files (single/multiple)
- Drag-and-drop upload
- Rename files/folders
- Delete files/folders
- File preview/download
- Admin-only modifications

### ✅ Activity Logging
- All role changes logged
- All file operations logged
- User actions tracked
- Timestamp and user attribution
- Filterable by type

### ✅ UI/UX
- Modern STEM-themed design
- MSC Initiative branding
- Smooth animations
- Responsive breakpoints
- Loading states
- Error handling
- Success/error alerts
- Confirmation dialogs

## Setup Required

### 1. Firebase Configuration

Update `/nexus/js/firebase.js` with your Firebase config:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Supabase Configuration

Update `/nexus/js/supabase.js` with your Supabase config:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Deploy Firebase Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Configure Security Rules

See `/nexus/README.md` for detailed Firestore and Supabase security rules.

## File Structure

```
nexus/
├── README.md                   # Detailed setup guide
├── login.html                  # Login page
├── signup.html                 # Signup page
├── dashboard.html              # Main dashboard
├── roles.html                  # Role management (admin)
├── files.html                  # File management
├── settings.html               # System settings (admin)
├── css/
│   ├── shared.css              # Common styles
│   ├── login.css
│   ├── signup.css
│   ├── dashboard.css
│   ├── roles.css
│   ├── files.css
│   └── settings.css
└── js/
    ├── firebase.js             # Firebase config
    ├── supabase.js             # Supabase config
    ├── firebaseFunctions.js    # Cloud Functions wrappers
    ├── login.js
    ├── signup.js
    ├── dashboard.js
    ├── roles.js
    ├── files.js
    └── settings.js

functions/
├── .gitignore
├── package.json
└── index.js                    # Cloud Functions
```

## Brand Colors

The portal uses MSC Initiative brand colors throughout:
- **White**: #FFFFFF
- **Peach**: #FFE5D0 (Light peach: #FFF0E6)
- **Orange**: #FF6B2C (Dark orange: #FF4E00)
- **Black**: #000000 (Charcoal: #1A1A1A)

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

The implementation includes placeholders for:
- Notification settings
- Email configuration
- Branding customization
- Additional permission granularity
- File versioning
- Advanced search

## Support

For issues, questions, or feature requests, contact the MSC Initiative development team or refer to the `/nexus/README.md` for detailed configuration instructions.

---

**Implementation Date**: December 2024
**Version**: 1.0.0
**Status**: Complete and Ready for Deployment
