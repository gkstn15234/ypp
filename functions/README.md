# Cloudflare Pages Functions Setup

This directory contains serverless functions for the Hugo editor.

## Environment Variables Setup

To enable image uploads, you need to configure the following environment variables in your Cloudflare Pages dashboard:

### Required Environment Variables

1. **CLOUDFLARE_ACCOUNT_ID**
   - Your Cloudflare account ID
   - Find this in your Cloudflare dashboard URL: `https://dash.cloudflare.com/{account-id}`

2. **CLOUDFLARE_API_TOKEN**
   - API token with Cloudflare Images:Edit permissions
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Use "Custom token" template
   - Permissions: `Cloudflare Images:Edit`
   - Account Resources: Include your account
   - Zone Resources: All zones (or specific zone if preferred)

### How to Set Environment Variables

1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to **Settings** > **Environment variables**
4. Add the required variables for **Production** environment
5. Deploy your site to apply the changes

## Functions

### `/api/upload-image`

Handles image uploads to Cloudflare Images with CORS support.

**Endpoint:** `POST /api/upload-image`

**Request:** `multipart/form-data` with a `file` field

**Response:**
```json
{
  "success": true,
  "url": "https://imagedelivery.net/{account-hash}/{image-id}/public",
  "id": "{image-id}"
}
```

**Features:**
- Validates file type (images only)
- Validates file size (max 5MB)
- Handles CORS preflight requests
- Returns optimized image URLs
- Error handling with detailed messages

## Security

- API credentials are stored securely as environment variables
- No sensitive data is exposed to the browser
- CORS is properly configured to allow uploads from your domain
- File validation prevents unauthorized uploads 