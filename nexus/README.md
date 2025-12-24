# Nexus Staff Portal

The Nexus Staff Portal is a secure, role-based staff management system for the MSC Initiative.

## Features

- **Authentication**: Email/password login with Firebase Authentication
- **Role Management**: Comprehensive role and permission system with admin-only access
- **File Management**: Full file system with Supabase Storage integration
- **User Management**: Manage user accounts, roles, and secondary emails
- **Activity Logging**: Track all system activities for audit purposes
- **Responsive Design**: Mobile-friendly interface with modern STEM-themed branding

## Configuration

### Environment Variables

The Nexus portal uses environment variables to securely manage API keys and configuration. These are injected at build time via the `build-env.sh` script.

#### Required Environment Variables

Set the following environment variables in your Cloudflare Pages project settings:

**Firebase Configuration:**
- `FIREBASE_API_KEY` - Your Firebase API key
- `FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain (e.g., `your-project.firebaseapp.com`)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket (e.g., `your-project.appspot.com`)
- `FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `FIREBASE_APP_ID` - Your Firebase app ID
- `FIREBASE_MEASUREMENT_ID` - Your Firebase measurement ID (optional, for Analytics)

**Supabase Configuration:**
- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxx.supabase.co`)
- `SUPABASE_KEY` - Your Supabase anon/public key

#### Cloudflare Pages Setup

1. Go to your Cloudflare Pages project settings
2. Navigate to **Settings** > **Environment Variables**
3. Add all the required environment variables listed above
4. Set the build command to: `./build-env.sh`
5. The script will generate `/nexus/js/env.js` with your environment variables at build time

**Important:** The `nexus/js/env.js` file is auto-generated during build and should never be committed to the repository. It's already added to `.gitignore`.

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password provider
3. Enable Firestore Database
4. Copy your Firebase configuration values to Cloudflare Pages environment variables

### Supabase Setup

1. Create a Supabase project at https://supabase.com/
2. Create a storage bucket named `msc-nexus`
3. Set appropriate access policies for the bucket
4. Copy your Supabase URL and anon key to Cloudflare Pages environment variables

### Firebase Functions Deployment

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in the project root: `firebase init`
   - Select Firestore, Functions, and Hosting
   - Choose your Firebase project
   - Select JavaScript for functions
4. Deploy functions:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

## Firestore Security Rules

Add the following security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([
               'Global - Initiative Director',
               'Global - Deputy Initiative Director'
             ]);
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own document
      allow read: if isAuthenticated() && request.auth.uid == userId;
      // Admins can read all user documents
      allow read: if isAdmin();
      // Users can create their own document on signup
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // Users can update their own document, admins can update any
      allow update: if (isAuthenticated() && request.auth.uid == userId) || isAdmin();
    }
    
    // Roles collection
    match /roles/{roleId} {
      // All authenticated users can read roles
      allow read: if isAuthenticated();
      // Only admins can create, update, or delete roles
      allow create, update, delete: if isAdmin();
    }
    
    // System logs collection
    match /systemLogs/{logId} {
      // Only admins can read logs
      allow read: if isAdmin();
      // Allow writes from authenticated users (for activity logging)
      allow create: if isAuthenticated();
    }
  }
}
```

## Supabase Storage Policies

Add the following storage policies to your `msc-nexus` bucket:

```sql
-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'msc-nexus');

-- Allow admin users to insert files (implement with JWT claims or custom check)
CREATE POLICY "Allow admins to insert files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'msc-nexus');

-- Allow admin users to update files
CREATE POLICY "Allow admins to update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'msc-nexus');

-- Allow admin users to delete files
CREATE POLICY "Allow admins to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'msc-nexus');
```

## Default Roles

The following default roles are automatically created on first admin access:

- **Global - Initiative Director** (ADMIN)
- **Global - Deputy Initiative Director** (ADMIN)
- **HAPU - School Lead**
- **HAPU - Deputy School Lead**
- **HAPU - Core Team**
- **HAPU - Support Team**
- **HAPU - Staff**
- **HAPU - Staff Coordinator**

## User Permissions

- **Admin Roles**: Full access to all features including role management, user management, and file operations
- **Non-Admin Roles**: Read-only access to files, can view dashboard and resources

## Structure

```
nexus/
├── login.html              # Login page
├── signup.html             # Signup page
├── dashboard.html          # Main dashboard
├── roles.html              # Role management (admin only)
├── files.html              # File management
├── settings.html           # System settings (admin only)
├── css/
│   ├── shared.css          # Shared styles
│   ├── login.css           # Login page styles
│   ├── signup.css          # Signup page styles
│   ├── dashboard.css       # Dashboard styles
│   ├── roles.css           # Roles page styles
│   ├── files.css           # Files page styles
│   └── settings.css        # Settings page styles
└── js/
    ├── firebase.js         # Firebase initialization
    ├── supabase.js         # Supabase configuration
    ├── firebaseFunctions.js # Cloud functions wrappers
    ├── login.js            # Login logic
    ├── signup.js           # Signup logic
    ├── dashboard.js        # Dashboard logic
    ├── roles.js            # Roles management logic
    ├── files.js            # File management logic
    └── settings.js         # Settings logic
```

## Branding

The portal uses the MSC Initiative brand colors:
- White: #FFFFFF
- Peach: #FFE5D0
- Orange: #FF6B2C
- Black: #000000

## Support

For issues or questions, contact the MSC Initiative development team.
