# Zoho Mail API Setup Guide

Complete guide to set up Zoho Mail API OAuth 2.0 for automated email sending from `donotreply@trackmyacademy.com`

---

## Prerequisites

1. **Zoho Mail Account**: `donotreply@trackmyacademy.com` must be configured as a Zoho Mail group email or account
2. **Zoho Developer Account**: Access to Zoho API Console
3. **Admin Access**: Ability to authorize Zoho applications

---

## Step 1: Create Zoho API Client

### 1.1 Go to Zoho API Console

Visit: https://api-console.zoho.in (India datacenter)

### 1.2 Create Server-Based Application

1. Click **"Add Client"**
2. Select **"Server-based Applications"**
3. Fill in details:
   - **Client Name**: `Track My Academy Email Service`
   - **Homepage URL**: `https://trackmyacademy.com`
   - **Authorized Redirect URIs**: `https://trackmyacademy.com/oauth/callback`
     (You can use any valid URL; this is for initial OAuth flow only)

4. Click **"Create"**

### 1.3 Note Your Credentials

After creation, you'll receive:
- **Client ID**: (e.g., `1000.ABC123XYZ456`)
- **Client Secret**: (e.g., `abc123xyz456secret789`)

**⚠️ Save these securely! You'll need them for environment variables.**

---

## Step 2: Generate Refresh Token

### 2.1 Generate Authorization Code

**Build the authorization URL** (replace `{CLIENT_ID}` with your actual client ID):

```
https://accounts.zoho.in/oauth/v2/auth?scope=ZohoMail.messages.CREATE,ZohoMail.accounts.READ&client_id={CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=https://trackmyacademy.com/oauth/callback
```

**Important scopes:**
- `ZohoMail.messages.CREATE` - Required to send emails
- `ZohoMail.accounts.READ` - Required to fetch account ID

### 2.2 Authorize the Application

1. Open the authorization URL in your browser
2. **Log in with the account** that has access to `donotreply@trackmyacademy.com`
3. Click **"Accept"** to grant permissions
4. You'll be redirected to: `https://trackmyacademy.com/oauth/callback?code=1000.abc123...`

5. **Copy the `code` parameter** from the URL
   - Example: `1000.abc123xyz456authorization789`
   - **⚠️ This code expires in 5 minutes! Use it immediately.**

### 2.3 Exchange Code for Refresh Token

Use this `curl` command (replace placeholders):

```bash
curl -X POST https://accounts.zoho.in/oauth/v2/token \
  -d "code={AUTHORIZATION_CODE}" \
  -d "client_id={CLIENT_ID}" \
  -d "client_secret={CLIENT_SECRET}" \
  -d "redirect_uri=https://trackmyacademy.com/oauth/callback" \
  -d "grant_type=authorization_code"
```

**Response:**
```json
{
  "access_token": "1000.xyz...",
  "refresh_token": "1000.abc123refreshtoken456",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**⚠️ Save the `refresh_token`** - This is permanent and used to get new access tokens.

---

## Step 3: Get Zoho Account ID (Optional)

The application will auto-fetch the account ID, but you can manually get it:

### 3.1 Get Access Token

```bash
curl -X POST https://accounts.zoho.in/oauth/v2/token \
  -d "refresh_token={REFRESH_TOKEN}" \
  -d "client_id={CLIENT_ID}" \
  -d "client_secret={CLIENT_SECRET}" \
  -d "grant_type=refresh_token"
```

### 3.2 Fetch Accounts

```bash
curl -X GET https://mail.zoho.in/api/accounts \
  -H "Authorization: Zoho-oauthtoken {ACCESS_TOKEN}"
```

**Response:**
```json
{
  "data": [
    {
      "accountId": "123456789",
      "accountName": "donotreply@trackmyacademy.com",
      ...
    }
  ]
}
```

**Copy the `accountId`** - This is your Zoho Mail account ID.

---

## Step 4: Configure Environment Variables

Add these to your `.env` file or environment:

```bash
# ============================================
# ZOHO MAIL API CONFIGURATION (OAuth 2.0)
# ============================================

# Client credentials from Zoho API Console
ZOHO_CLIENT_ID=1000.ABC123XYZ456
ZOHO_CLIENT_SECRET=abc123xyz456secret789

# Refresh token (permanent, used to get access tokens)
ZOHO_REFRESH_TOKEN=1000.abc123refreshtoken456

# Account ID (optional - will be auto-fetched if not provided)
ZOHO_ACCOUNT_ID=123456789
```

**Security Best Practices:**
- ✅ Never commit `.env` to version control
- ✅ Use environment variables in production
- ✅ Rotate refresh tokens periodically
- ✅ Restrict API console access

---

## Step 5: Test the Integration

### 5.1 Run Test Script

Create a test script:

```python
# test_zoho_email.py
from zoho_mail_api import test_zoho_mail_api_connection, send_mail_via_zoho_api
from datetime import datetime

# Test connection
print("Testing Zoho Mail API connection...")
results = test_zoho_mail_api_connection()

if results["success"]:
    print("✅ Connection test passed!")
    print(results["steps"])

    # Test sending email
    print("\nTesting email send...")
    try:
        send_mail_via_zoho_api(
            to_email="your-test-email@example.com",
            subject="Test Email from Track My Academy",
            html_content="<h1>Test successful!</h1><p>Zoho Mail API is working.</p>"
        )
        print("✅ Test email sent successfully!")
    except Exception as e:
        print(f"❌ Email send failed: {e}")
else:
    print("❌ Connection test failed!")
    print(results)
```

Run it:
```bash
cd backend
python test_zoho_email.py
```

### 5.2 Check Backend Logs

When sending automatic reminders, check logs for:

```
INFO: Sending automatic fee reminder via Zoho Mail API to player@email.com
INFO: Refreshing Zoho access token...
INFO: ✅ Access token refreshed successfully. Expires in 3600s
INFO: Using configured Zoho account ID: 123456789
INFO: Sending email to player@email.com via Zoho Mail API...
INFO: Zoho API response status: 200
INFO: ✅ Email sent successfully to player@email.com via Zoho Mail API
INFO: ✅ Automatic reminder sent successfully to player@email.com
```

---

## Step 6: Verify Email Sending

### 6.1 Test Automatic Reminder

1. Log in to academy dashboard
2. Go to **Fee Collection**
3. Ensure **"Automatic"** is selected in System Settings → Fee Reminder Type
4. Click **"Send Reminder"** for a player with unpaid fees
5. Check backend logs for Zoho API activity
6. Verify email arrives in player's inbox

### 6.2 Check Sent Folder

1. Log in to Zoho Mail as `donotreply@trackmyacademy.com`
2. Check **"Sent"** folder
3. Verify emails are being sent successfully

---

## Required Environment Variables Summary

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ZOHO_CLIENT_ID` | OAuth client ID from API console | `1000.ABC123XYZ` | ✅ Yes |
| `ZOHO_CLIENT_SECRET` | OAuth client secret | `abc123secret456` | ✅ Yes |
| `ZOHO_REFRESH_TOKEN` | Permanent refresh token | `1000.refresh123` | ✅ Yes |
| `ZOHO_ACCOUNT_ID` | Zoho Mail account ID | `123456789` | ⚠️ Optional* |

*If not provided, will be auto-fetched on first API call

---

## Troubleshooting

### Issue: "SMTP credentials not configured"

**Cause**: Old SMTP-based function being called instead of Zoho API

**Fix**: Ensure `zoho_mail_api.py` is imported correctly in `server.py`

### Issue: "Token refresh failed"

**Possible causes:**
1. **Invalid refresh token** - Regenerate using Step 2
2. **Expired authorization code** - Code expires in 5 minutes
3. **Wrong client credentials** - Verify client ID and secret

**Fix**:
- Verify `ZOHO_REFRESH_TOKEN` is correct
- Check client ID and secret match API console
- Ensure using India endpoints (`.in`)

### Issue: "Zoho Mail API failed: Invalid account"

**Cause**: Account ID is incorrect or email not configured

**Fix**:
- Remove `ZOHO_ACCOUNT_ID` from `.env` to auto-fetch
- Verify `donotreply@trackmyacademy.com` exists in Zoho Mail
- Check OAuth was authorized with correct account

### Issue: "403 Forbidden" or "Insufficient scope"

**Cause**: Missing required OAuth scopes

**Fix**: Re-authorize with correct scopes:
- `ZohoMail.messages.CREATE`
- `ZohoMail.accounts.READ`

### Issue: Email not arriving

**Checks:**
1. ✅ Check backend logs - was it sent successfully?
2. ✅ Check Zoho Mail Sent folder
3. ✅ Check recipient's spam/junk folder
4. ✅ Verify `from_address` is `donotreply@trackmyacademy.com`
5. ✅ Ensure player has valid email in database

---

## Security Considerations

### ✅ DO:
- Store credentials in environment variables
- Use `.gitignore` for `.env` files
- Rotate refresh tokens every 6 months
- Monitor API usage in Zoho console
- Use HTTPS for all API calls
- Log all email sends for audit

### ❌ DON'T:
- Commit secrets to Git
- Share refresh tokens via email/chat
- Use personal Zoho accounts
- Hardcode credentials
- Disable OAuth scopes
- Use SMTP for group emails

---

## API Limits

**Zoho Mail API Limits:**
- **Rate Limit**: 100 emails per minute per account
- **Daily Limit**: 10,000 emails per day (verify with Zoho plan)
- **Token Expiry**: Access tokens expire in 1 hour
- **Refresh Token**: Permanent (unless revoked)

**Best Practices:**
- Implement retry logic with exponential backoff
- Cache access tokens (already implemented)
- Monitor API usage
- Use batch sending for multiple emails

---

## Migration from SMTP

If migrating from SMTP to Zoho Mail API:

### Why Migrate?

| SMTP | Zoho Mail API |
|------|---------------|
| ❌ Less reliable for group emails | ✅ Official OAuth-based |
| ❌ Password-based auth | ✅ Secure token-based |
| ❌ May be blocked by firewalls | ✅ HTTPS REST API |
| ❌ Less detailed error messages | ✅ Structured error responses |

### Migration Steps:

1. ✅ Set up OAuth as described above
2. ✅ Configure environment variables
3. ✅ Test with `test_zoho_mail_api_connection()`
4. ✅ Update automatic reminder to use Zoho API (already done)
5. ✅ Manual reminders still use SMTP (as configured)
6. ✅ Monitor logs for successful sends

---

## Support & Resources

- **Zoho Mail API Docs**: https://www.zoho.com/mail/help/api/
- **Zoho API Console**: https://api-console.zoho.in
- **OAuth Guide**: https://www.zoho.com/accounts/protocol/oauth.html
- **Support**: support@zoho.com

---

## Checklist

Before going to production:

- [ ] Created Zoho API client (server-based)
- [ ] Generated refresh token with correct scopes
- [ ] Configured all environment variables
- [ ] Tested connection with `test_zoho_mail_api_connection()`
- [ ] Sent test email successfully
- [ ] Verified email arrives in inbox
- [ ] Checked backend logs show "✅ Email sent"
- [ ] Secured credentials (not in Git)
- [ ] Documented for team
- [ ] Set up monitoring/alerts

---

**Last Updated**: December 2025
**Version**: 1.0
**Maintained By**: Track My Academy Backend Team
