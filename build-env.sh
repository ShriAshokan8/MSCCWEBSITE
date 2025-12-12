#!/bin/bash
set -euo pipefail
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

# Escape single quotes in environment variables for JavaScript string safety
escape_js_string() {
    echo "$1" | sed "s/'/\\\\'/g"
}

# Generate env.js with properly escaped values
cat > nexus/js/env.js << EOF
window.ENV = {
    FIREBASE_API_KEY: '$(escape_js_string "${FIREBASE_API_KEY}")',
    FIREBASE_AUTH_DOMAIN: '$(escape_js_string "${FIREBASE_AUTH_DOMAIN}")',
    FIREBASE_PROJECT_ID: '$(escape_js_string "${FIREBASE_PROJECT_ID}")',
    FIREBASE_STORAGE_BUCKET: '$(escape_js_string "${FIREBASE_STORAGE_BUCKET}")',
    FIREBASE_MESSAGING_SENDER_ID: '$(escape_js_string "${FIREBASE_MESSAGING_SENDER_ID}")',
    FIREBASE_APP_ID: '$(escape_js_string "${FIREBASE_APP_ID}")',
    FIREBASE_MEASUREMENT_ID: '$(escape_js_string "${FIREBASE_MEASUREMENT_ID}")',
    SUPABASE_URL: '$(escape_js_string "${SUPABASE_URL}")',
    SUPABASE_KEY: '$(escape_js_string "${SUPABASE_KEY}")'
};
EOF
