#!/bin/bash
# Generate env.js with Cloudflare Pages environment variables

# Validate required environment variables
REQUIRED_VARS=(
    "FIREBASE_API_KEY"
    "FIREBASE_AUTH_DOMAIN"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
    "SUPABASE_URL"
    "SUPABASE_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "Error: Missing required environment variables:"
    printf '  - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please set these environment variables in your Cloudflare Pages project settings."
    exit 1
fi

cat > nexus/js/env.js << EOF
window.ENV = {
    FIREBASE_API_KEY: '${FIREBASE_API_KEY}',
    FIREBASE_AUTH_DOMAIN: '${FIREBASE_AUTH_DOMAIN}',
    FIREBASE_PROJECT_ID: '${FIREBASE_PROJECT_ID}',
    FIREBASE_STORAGE_BUCKET: '${FIREBASE_STORAGE_BUCKET}',
    FIREBASE_MESSAGING_SENDER_ID: '${FIREBASE_MESSAGING_SENDER_ID}',
    FIREBASE_APP_ID: '${FIREBASE_APP_ID}',
    FIREBASE_MEASUREMENT_ID: '${FIREBASE_MEASUREMENT_ID}',
    SUPABASE_URL: '${SUPABASE_URL}',
    SUPABASE_KEY: '${SUPABASE_KEY}'
};
EOF
