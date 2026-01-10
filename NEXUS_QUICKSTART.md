# Nexus Portal - Quick Start Guide

Get your Nexus portal up and running in minutes!

## Prerequisites

- Firebase account and project
- Supabase account and project
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)

## Quick Setup (5 Steps)

### Step 1: Configure Credentials

**Option A: Use the setup script (Recommended)**

```bash
chmod +x setup-nexus-config.sh
./setup-nexus-config.sh
```

The script will prompt you for:

- Firebase Auth Domain
- Firebase Project ID
- Firebase Storage Bucket
- Firebase Messaging Sender ID
- Firebase App ID
- Supabase URL
- Supabase Anon Key

**Option B: Manual configuration**

1. Edit `nexus/js/firebase.js` - replace `YOUR_*` placeholders
2. Edit `nexus/js/supabase.js` - replace `YOUR_*` placeholders

### Step 2: Enable Firebase Services

In Firebase Console (https://console.firebase.google.com):

1. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider

2. **Enable Firestore**:
   - Go to Firestore Database
   - Create database (start in production mode)

3. **Apply Security Rules**:
   - Copy rules from `nexus/README.md` (Firestore Security Rules section)
   - Paste in Rules tab
   - Publish

### Step 3: Set Up Supabase Storage

In Supabase Dashboard (https://app.supabase.com):

1. **Create Storage Bucket**:
   - Go to Storage
   - Create new bucket named `msc-nexus`
   - Make it private

2. **Apply Storage Policies**:
   - Go to bucket → Policies
   - Copy policies from `nexus/README.md` (Supabase Storage Policies section)
   - Add each policy

### Step 4: Deploy Firebase Functions

```bash
cd functions
npm install
firebase login
firebase deploy --only functions
```

### Step 5: Test the Portal

1. Open `nexus/signup.html` in your browser
2. Create a test account
3. Log in at `nexus/login.html`
4. Explore the dashboard!

## First User Setup

The first user you create should be made an admin:

1. Sign up via `nexus/signup.html`
2. Go to Firebase Console → Firestore Database
3. Find your user document in the `users` collection
4. Edit the `roles` field to include:
   ```
   ["Global - Initiative Director"]
   ```
5. Refresh the Nexus portal
6. You now have admin access!

## GitHub Actions Setup (Optional)

For automatic deployments:

1. Generate Firebase CI token:
   ```bash
   firebase login:ci
   ```

2. Add to GitHub Secrets:
   - Go to repo Settings → Secrets and variables → Actions
   - Add secret: `FIREBASE_TOKEN` with the token from step 1

3. Workflows will automatically:
   - Validate code on PRs
   - Deploy functions on push to main

## Troubleshooting

### "Cannot read property 'initializeApp' of undefined"
- Firebase SDK not loaded. Check that CDN links are accessible.

### "Invalid API key"
- Check your Firebase configuration in `nexus/js/firebase.js`
- Verify the API key in Firebase Console

### "Supabase client initialization failed"
- Check your Supabase URL and anon key in `nexus/js/supabase.js`
- Verify the project is active in Supabase Dashboard

### Cannot upload files
- Check that you're logged in as an admin user
- Verify the `msc-nexus` bucket exists in Supabase
- Check storage policies are applied

### Functions not working
- Make sure functions are deployed: `firebase deploy --only functions`
- Check function logs in Firebase Console
- Verify you're calling functions as an authenticated admin user

## Default Roles

The system creates 8 default roles automatically:

**Admin Roles** (full access):
- Global - Initiative Director
- Global - Deputy Initiative Director

**Standard Roles** (read-only access):
- HAPU - School Lead
- HAPU - Deputy School Lead
- HAPU - Core Team
- HAPU - Support Team
- HAPU - Staff
- HAPU - Staff Coordinator

## File Structure

```
nexus/
├── login.html              # Login page
├── signup.html             # Registration page
├── dashboard.html          # Main dashboard
├── roles.html              # Role management (admin)
├── files.html              # File manager
├── settings.html           # System settings (admin)
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
└── README.md               # Detailed documentation

functions/
├── index.js                # Cloud Functions
└── package.json            # Dependencies
```

## Need Help?

- **Setup Guide**: `NEXUS_CONFIG_GUIDE.md`
- **Architecture**: `NEXUS_IMPLEMENTATION_GUIDE.md`
- **Visual Reference**: `NEXUS_VISUAL_OVERVIEW.md`
- **Detailed Docs**: `nexus/README.md`

## Security Checklist

- [ ] Firebase Authentication enabled
- [ ] Firestore security rules applied
- [ ] Supabase storage policies applied
- [ ] Admin user created with proper roles
- [ ] Credentials not committed to git
- [ ] GitHub Secrets configured (if using Actions)
- [ ] Test login/signup flow
- [ ] Test file upload/download
- [ ] Test role assignment

## Support

For issues or questions:
- Review the documentation files listed above
- Check Firebase/Supabase console logs
- Verify all credentials are correct

---

**Status**: Ready to deploy! 🚀

All code is complete. Just add your credentials and deploy!
