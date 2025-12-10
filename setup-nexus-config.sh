#!/bin/bash

# Nexus Portal Configuration Setup Script
# This script helps set up Firebase and Supabase configuration for the Nexus portal

set -e

echo "================================================"
echo "Nexus Portal Configuration Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to read input with default value
read_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    read -p "$prompt [$default]: " input
    eval $var_name='${input:-$default}'
}

echo "This script will help you configure Firebase and Supabase credentials."
echo ""
echo -e "${YELLOW}⚠️  Important: Your credentials will be stored in local files.${NC}"
echo -e "${YELLOW}   Make sure these files are in .gitignore to avoid committing secrets.${NC}"
echo ""

# Ask for configuration method
echo "How would you like to configure credentials?"
echo "1) Update JavaScript files directly (for development)"
echo "2) Create .env.local file (recommended)"
read -p "Choose option [1 or 2]: " config_method

if [ "$config_method" != "1" ] && [ "$config_method" != "2" ]; then
    echo -e "${RED}Invalid option. Exiting.${NC}"
    exit 1
fi

# Collect Firebase credentials
echo ""
echo "================================================"
echo "Firebase Configuration"
echo "================================================"
echo ""
echo "Enter your Firebase project credentials:"
echo "(You can find these in Firebase Console → Project Settings → General)"
echo ""

read -p "Firebase API Key: " FIREBASE_API_KEY
read -p "Firebase Auth Domain (e.g., project-id.firebaseapp.com): " FIREBASE_AUTH_DOMAIN
read -p "Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "Firebase Storage Bucket (e.g., project-id.appspot.com): " FIREBASE_STORAGE_BUCKET
read -p "Firebase Messaging Sender ID: " FIREBASE_MESSAGING_SENDER_ID
read -p "Firebase App ID: " FIREBASE_APP_ID

# Collect Supabase credentials
echo ""
echo "================================================"
echo "Supabase Configuration"
echo "================================================"
echo ""
echo "Enter your Supabase project credentials:"
echo "(You can find these in Supabase Dashboard → Project Settings → API)"
echo ""

read -p "Supabase URL (e.g., https://xxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY

# Validate inputs
if [ -z "$FIREBASE_API_KEY" ] || [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Error: Required fields cannot be empty.${NC}"
    exit 1
fi

# Apply configuration based on method
if [ "$config_method" == "1" ]; then
    echo ""
    echo "Updating JavaScript files..."
    
    # Update firebase.js
    sed -i.bak \
        -e "s|YOUR_API_KEY|$FIREBASE_API_KEY|g" \
        -e "s|YOUR_AUTH_DOMAIN|$FIREBASE_AUTH_DOMAIN|g" \
        -e "s|YOUR_PROJECT_ID|$FIREBASE_PROJECT_ID|g" \
        -e "s|YOUR_STORAGE_BUCKET|$FIREBASE_STORAGE_BUCKET|g" \
        -e "s|YOUR_MESSAGING_SENDER_ID|$FIREBASE_MESSAGING_SENDER_ID|g" \
        -e "s|YOUR_APP_ID|$FIREBASE_APP_ID|g" \
        nexus/js/firebase.js
    
    # Update supabase.js
    sed -i.bak \
        -e "s|YOUR_SUPABASE_URL|$SUPABASE_URL|g" \
        -e "s|YOUR_SUPABASE_ANON_KEY|$SUPABASE_ANON_KEY|g" \
        nexus/js/supabase.js
    
    echo -e "${GREEN}✓ JavaScript files updated successfully${NC}"
    echo -e "${YELLOW}⚠️  Backup files created: firebase.js.bak, supabase.js.bak${NC}"
    echo -e "${YELLOW}⚠️  DO NOT commit nexus/js/firebase.js and nexus/js/supabase.js to git${NC}"
    
else
    echo ""
    echo "Creating .env.local file..."
    
    cat > .env.local << EOF
# Firebase Configuration
FIREBASE_API_KEY=$FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID=$FIREBASE_APP_ID

# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
    
    echo -e "${GREEN}✓ .env.local file created successfully${NC}"
    echo ""
    echo "Note: You'll need to load these variables in your application."
    echo "The .env.local file is already in .gitignore and won't be committed."
fi

echo ""
echo "================================================"
echo "Configuration Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Deploy Firebase Functions:"
echo "   cd functions && npm install && firebase deploy --only functions"
echo ""
echo "2. Apply Firestore security rules (see nexus/README.md)"
echo ""
echo "3. Create Supabase storage bucket 'msc-nexus'"
echo ""
echo "4. Apply Supabase storage policies (see nexus/README.md)"
echo ""
echo "5. Test the Nexus portal by opening nexus/login.html in a browser"
echo ""
echo -e "${GREEN}Setup complete! 🎉${NC}"
echo ""
