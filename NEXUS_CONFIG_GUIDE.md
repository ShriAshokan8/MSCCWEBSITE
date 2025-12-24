# Nexus Portal Configuration Guide

This guide explains how to configure the Nexus portal with Firebase and Supabase credentials.

## Step 1: Configure Firebase

### Option A: Using Environment Variables (Recommended for Security)

For production deployments, it's recommended to use environment variables or GitHub Secrets to store sensitive configuration.

1. **Add Firebase config as GitHub Secrets**:
   - Go to your repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `FIREBASE_API_KEY`
     - `FIREBASE_AUTH_DOMAIN`
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_STORAGE_BUCKET`
     - `FIREBASE_MESSAGING_SENDER_ID`
     - `FIREBASE_APP_ID`

2. **For Firebase Functions deployment**:
   - Generate a Firebase token: `firebase login:ci`
   - Add the token as `FIREBASE_TOKEN` secret in GitHub

### Option B: Direct Configuration (For Development Only)

Edit `nexus/js/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

**⚠️ Warning**: Do not commit actual credentials to the repository. Use `.gitignore` to exclude files with sensitive data.

## Step 2: Configure Supabase

### Option A: Using Environment Variables (Recommended)

1. **Add Supabase config as GitHub Secrets**:
   - Go to your repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`

### Option B: Direct Configuration (For Development Only)

Edit `nexus/js/supabase.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

## Step 3: Set Up Firebase Functions

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase (if not already done)**:
   ```bash
   firebase init
   ```
   - Select Firestore, Functions, and Hosting
   - Choose your Firebase project
   - Select JavaScript for functions
   - Choose the `functions` directory

4. **Install dependencies**:
   ```bash
   cd functions
   npm install
   ```

5. **Deploy functions**:
   ```bash
   firebase deploy --only functions
   ```

## Step 4: Configure Firestore Security Rules

In Firebase Console:
1. Go to Firestore Database → Rules
2. Copy the rules from `nexus/README.md` (Firestore Security Rules section)
3. Publish the rules

## Step 5: Configure Supabase Storage Policies

In Supabase Dashboard:
1. Go to Storage → msc-nexus bucket
2. Go to Policies tab
3. Copy the policies from `nexus/README.md` (Supabase Storage Policies section)
4. Apply the policies

## Step 6: Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create a new bucket named `msc-nexus`
3. Set it as public or private based on your needs (recommend private with policies)

## GitHub Actions Workflows

The repository includes two workflows:

### 1. Firebase Deploy (`firebase-deploy.yml`)
- **Trigger**: Push to main branch (functions directory changes) or manual
- **Purpose**: Automatically deploy Firebase Functions
- **Required Secret**: `FIREBASE_TOKEN`

To set up:
```bash
firebase login:ci
# Copy the token and add it as FIREBASE_TOKEN secret in GitHub
```

### 2. Nexus Validate (`nexus-validate.yml`)
- **Trigger**: Pull requests and pushes to main
- **Purpose**: Validate HTML, JS, and check for placeholder configs
- **No secrets required**

## Configuration File Template

Create a `.env.local` file (add to .gitignore) for local development:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Supabase Configuration
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

## Security Best Practices

1. **Never commit credentials to git**
   - Add config files to `.gitignore`
   - Use environment variables
   - Use GitHub Secrets for CI/CD

2. **Use different projects for dev/staging/prod**
   - Development: local emulators
   - Staging: separate Firebase/Supabase projects
   - Production: separate Firebase/Supabase projects

3. **Rotate keys regularly**
   - Update Firebase keys periodically
   - Update Supabase keys periodically
   - Revoke unused tokens

4. **Review security rules**
   - Test Firestore rules with Firebase Emulator
   - Test Supabase policies in staging
   - Monitor unauthorized access attempts

## Troubleshooting

### Firebase initialization errors
- Check that all config values are correct
- Verify Firebase project is active
- Ensure Authentication and Firestore are enabled

### Supabase connection errors
- Verify the Supabase URL is correct
- Check the anon key is valid
- Ensure the bucket exists

### Function deployment errors
- Check Node.js version (use 18)
- Verify Firebase CLI is up to date
- Check function logs in Firebase Console

## Support

For detailed information, see:
- `nexus/README.md` - Complete setup guide
- `NEXUS_IMPLEMENTATION_GUIDE.md` - Architecture overview
- Firebase documentation: https://firebase.google.com/docs
- Supabase documentation: https://supabase.com/docs
