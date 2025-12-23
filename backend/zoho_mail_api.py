"""
Zoho Mail API Integration for Automated Email Sending

This module handles OAuth 2.0 authentication and email sending via Zoho Mail API.
Uses Zoho India endpoints (.in) for all operations.

Requirements:
- requests library for HTTP operations
- Environment variables for credentials (see below)

Author: Track My Academy Backend Team
"""

import os
import requests
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# ============================================================================
# ZOHO API CONFIGURATION (India Endpoints)
# ============================================================================

# Zoho India OAuth endpoints
ZOHO_ACCOUNTS_URL = "https://accounts.zoho.in"
ZOHO_MAIL_API_URL = "https://mail.zoho.in/api"

# OAuth endpoints
TOKEN_URL = f"{ZOHO_ACCOUNTS_URL}/oauth/v2/token"
AUTH_URL = f"{ZOHO_ACCOUNTS_URL}/oauth/v2/auth"

# Mail API endpoints
SEND_MAIL_ENDPOINT = f"{ZOHO_MAIL_API_URL}/accounts/{{accountId}}/messages"
GET_ACCOUNTS_ENDPOINT = f"{ZOHO_MAIL_API_URL}/accounts"

# ============================================================================
# ENVIRONMENT VARIABLES (Required)
# ============================================================================

# These must be set in your .env file or environment:
# ZOHO_CLIENT_ID=your_client_id_here
# ZOHO_CLIENT_SECRET=your_client_secret_here
# ZOHO_REFRESH_TOKEN=your_refresh_token_here
# ZOHO_ACCOUNT_ID=your_account_id_here (optional, will be fetched if not set)

ZOHO_CLIENT_ID = os.environ.get('ZOHO_CLIENT_ID', '')
ZOHO_CLIENT_SECRET = os.environ.get('ZOHO_CLIENT_SECRET', '')
ZOHO_REFRESH_TOKEN = os.environ.get('ZOHO_REFRESH_TOKEN', '')
ZOHO_ACCOUNT_ID = os.environ.get('ZOHO_ACCOUNT_ID', '')

# ============================================================================
# IN-MEMORY TOKEN CACHE
# ============================================================================

# Cache to store access token and expiry time
# In production, consider using Redis or database for multi-instance deployments
_token_cache = {
    "access_token": None,
    "expires_at": None
}


# ============================================================================
# OAUTH 2.0 TOKEN MANAGEMENT
# ============================================================================

def get_access_token() -> str:
    """
    Get valid Zoho access token. Uses cached token if valid, otherwise refreshes.

    Returns:
        str: Valid Zoho access token

    Raises:
        Exception: If token refresh fails or credentials are invalid
    """
    # Check if we have a valid cached token
    if _token_cache["access_token"] and _token_cache["expires_at"]:
        if datetime.utcnow() < _token_cache["expires_at"]:
            logger.info("Using cached Zoho access token")
            return _token_cache["access_token"]

    # Token expired or doesn't exist, refresh it
    logger.info("Refreshing Zoho access token...")
    return refresh_access_token()


def refresh_access_token() -> str:
    """
    Refresh Zoho access token using refresh token.

    OAuth 2.0 Token Refresh Flow:
    1. POST to token endpoint with refresh_token
    2. Receive new access_token (valid for 1 hour)
    3. Cache the new token with expiry time

    Returns:
        str: New access token

    Raises:
        Exception: If refresh fails or credentials are invalid
    """
    # Validate required credentials
    if not ZOHO_CLIENT_ID or not ZOHO_CLIENT_SECRET or not ZOHO_REFRESH_TOKEN:
        error_msg = (
            "Zoho OAuth credentials not configured. Please set:\n"
            "ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN"
        )
        logger.error(error_msg)
        raise Exception(error_msg)

    try:
        logger.info("Requesting new access token from Zoho...")

        # Prepare token refresh request
        payload = {
            "refresh_token": ZOHO_REFRESH_TOKEN,
            "client_id": ZOHO_CLIENT_ID,
            "client_secret": ZOHO_CLIENT_SECRET,
            "grant_type": "refresh_token"
        }

        # Make token refresh request
        response = requests.post(
            TOKEN_URL,
            data=payload,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=30
        )

        # Log response for debugging
        logger.info(f"Token refresh response status: {response.status_code}")

        if response.status_code != 200:
            error_detail = response.text
            logger.error(f"Token refresh failed: {error_detail}")
            raise Exception(f"Zoho token refresh failed: {error_detail}")

        # Parse response
        token_data = response.json()

        if 'access_token' not in token_data:
            logger.error(f"No access_token in response: {token_data}")
            raise Exception("Invalid token response from Zoho")

        access_token = token_data['access_token']
        expires_in = token_data.get('expires_in', 3600)  # Default 1 hour

        # Cache the token with expiry (subtract 5 minutes for safety margin)
        _token_cache["access_token"] = access_token
        _token_cache["expires_at"] = datetime.utcnow() + timedelta(seconds=expires_in - 300)

        logger.info(f"✅ Access token refreshed successfully. Expires in {expires_in}s")
        return access_token

    except requests.exceptions.RequestException as req_error:
        error_msg = f"Network error during token refresh: {str(req_error)}"
        logger.error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Failed to refresh Zoho access token: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise


# ============================================================================
# ZOHO ACCOUNT ID MANAGEMENT
# ============================================================================

def get_account_id() -> str:
    """
    Get Zoho Mail account ID for donotreply@trackmyacademy.com

    If ZOHO_ACCOUNT_ID is set in env, uses that.
    Otherwise, fetches from Zoho Mail API.

    Returns:
        str: Zoho Mail account ID

    Raises:
        Exception: If account ID cannot be determined
    """
    # Use cached/configured account ID if available
    if ZOHO_ACCOUNT_ID:
        logger.info(f"Using configured Zoho account ID: {ZOHO_ACCOUNT_ID}")
        return ZOHO_ACCOUNT_ID

    # Fetch account ID from API
    logger.info("Fetching Zoho account ID from API...")

    try:
        access_token = get_access_token()

        headers = {
            'Authorization': f'Zoho-oauthtoken {access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.get(
            GET_ACCOUNTS_ENDPOINT,
            headers=headers,
            timeout=30
        )

        if response.status_code != 200:
            logger.error(f"Failed to fetch account ID: {response.text}")
            raise Exception(f"Cannot fetch Zoho account ID: {response.text}")

        accounts_data = response.json()

        # Find account for donotreply@trackmyacademy.com
        if 'data' in accounts_data and len(accounts_data['data']) > 0:
            # Usually first account is primary
            account_id = accounts_data['data'][0]['accountId']
            logger.info(f"✅ Fetched Zoho account ID: {account_id}")
            return account_id
        else:
            logger.error(f"No accounts found in response: {accounts_data}")
            raise Exception("No Zoho Mail accounts found")

    except Exception as e:
        error_msg = f"Failed to get Zoho account ID: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)


# ============================================================================
# EMAIL SENDING VIA ZOHO MAIL API
# ============================================================================

def send_mail_via_zoho_api(
    to_email: str,
    subject: str,
    html_content: str,
    from_address: str = "donotreply@trackmyacademy.com"
) -> bool:
    """
    Send email using Zoho Mail API (OAuth-based, NOT SMTP)

    This function:
    1. Gets valid access token (refreshes if needed)
    2. Gets Zoho account ID
    3. Constructs email message
    4. Sends via Zoho Mail Send Message API

    Args:
        to_email: Recipient email address
        subject: Email subject line
        html_content: Email body in HTML format
        from_address: Sender email (must be verified in Zoho)

    Returns:
        bool: True if email sent successfully

    Raises:
        Exception: If email sending fails with detailed error
    """
    try:
        # Validate inputs
        if not to_email or '@' not in to_email:
            raise ValueError(f"Invalid recipient email: {to_email}")

        if not subject or not subject.strip():
            raise ValueError("Email subject is required")

        if not html_content or not html_content.strip():
            raise ValueError("Email content is required")

        logger.info(f"Preparing to send email via Zoho Mail API to: {to_email}")

        # Step 1: Get valid access token
        access_token = get_access_token()

        # Step 2: Get account ID
        account_id = get_account_id()

        # Step 3: Prepare email message
        # Zoho Mail API expects specific JSON structure
        email_data = {
            "fromAddress": from_address,
            "toAddress": to_email,
            "subject": subject,
            "content": html_content,
            "mailFormat": "html"  # Specify HTML format
        }

        # Step 4: Send email via API
        send_url = SEND_MAIL_ENDPOINT.format(accountId=account_id)

        headers = {
            'Authorization': f'Zoho-oauthtoken {access_token}',
            'Content-Type': 'application/json'
        }

        logger.info(f"Sending email to {to_email} via Zoho Mail API...")
        logger.debug(f"Send URL: {send_url}")

        response = requests.post(
            send_url,
            headers=headers,
            json=email_data,
            timeout=30
        )

        logger.info(f"Zoho API response status: {response.status_code}")
        logger.debug(f"Response body: {response.text}")

        # Check response
        if response.status_code in [200, 201]:
            logger.info(f"✅ Email sent successfully to {to_email} via Zoho Mail API")
            return True
        else:
            error_detail = response.text
            logger.error(f"Zoho Mail API error: {error_detail}")

            # Parse error for better message
            try:
                error_json = response.json()
                error_msg = error_json.get('message', error_detail)
            except:
                error_msg = error_detail

            raise Exception(f"Zoho Mail API failed: {error_msg}")

    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise
    except requests.exceptions.RequestException as req_error:
        error_msg = f"Network error sending email: {str(req_error)}"
        logger.error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Failed to send email via Zoho Mail API: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise


# ============================================================================
# HIGH-LEVEL WRAPPER FOR AUTOMATED EMAILS
# ============================================================================

def send_automated_fee_reminder(
    to_email: str,
    player_name: str,
    academy_name: str,
    fee_amount: float,
    due_date: datetime,
    frequency: str = 'monthly'
) -> bool:
    """
    Send automated fee reminder email using Zoho Mail API.

    This is a wrapper around send_mail_via_zoho_api with pre-formatted template.
    Designed for use in cron jobs and automated reminders.

    Args:
        to_email: Player's email address
        player_name: Name of the player
        academy_name: Name of the academy
        fee_amount: Fee amount in INR
        due_date: Payment due date
        frequency: Fee frequency (monthly, quarterly, etc.)

    Returns:
        bool: True if email sent successfully

    Raises:
        Exception: If sending fails
    """
    try:
        # Format due date
        due_date_str = due_date.strftime('%B %d, %Y')

        # Calculate days until due
        days_until_due = (due_date - datetime.utcnow()).days

        if days_until_due < 0:
            urgency_text = f"⚠️ This payment is {abs(days_until_due)} days overdue."
            urgency_class = "background: #fee2e2; border-left: 4px solid #dc2626;"
        elif days_until_due == 0:
            urgency_text = "⚠️ This payment is due today!"
            urgency_class = "background: #fef3c7; border-left: 4px solid #f59e0b;"
        elif days_until_due <= 3:
            urgency_text = f"⚠️ This payment is due in {days_until_due} day(s)."
            urgency_class = "background: #fef3c7; border-left: 4px solid #f59e0b;"
        else:
            urgency_text = f"This payment is due in {days_until_due} days."
            urgency_class = "background: #dbeafe; border-left: 4px solid #3b82f6;"

        # Professional HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .content {{
                    background: #ffffff;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                    border-top: none;
                }}
                .fee-details {{
                    background: #f9fafb;
                    border-left: 4px solid #0ea5e9;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }}
                .fee-details h2 {{
                    margin-top: 0;
                    color: #0ea5e9;
                    font-size: 18px;
                }}
                .amount {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #0ea5e9;
                    margin: 10px 0;
                }}
                .urgency {{
                    {urgency_class}
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 5px;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 20px;
                    text-align: center;
                    border-radius: 0 0 10px 10px;
                    font-size: 12px;
                    color: #6b7280;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Fee Payment Reminder</h1>
            </div>

            <div class="content">
                <p>Dear {player_name},</p>

                <p>This is an automated reminder about your fee payment for <strong>{academy_name}</strong>.</p>

                <div class="fee-details">
                    <h2>Payment Details</h2>
                    <div class="amount">₹{fee_amount:,.2f}</div>
                    <p><strong>Frequency:</strong> {frequency.capitalize()}</p>
                    <p><strong>Due Date:</strong> {due_date_str}</p>
                </div>

                <div class="urgency">
                    {urgency_text}
                </div>

                <p>Please ensure your payment is completed by the due date to avoid any interruption in your training.</p>

                <p>If you have already made the payment, please disregard this reminder.</p>

                <p>For any questions or payment assistance, please contact your academy administration.</p>

                <p>Best regards,<br>
                <strong>{academy_name}</strong></p>
            </div>

            <div class="footer">
                <p>This is an automated message from Track My Academy.<br>
                Please do not reply to this email.</p>
                <p>&copy; {datetime.utcnow().year} Track My Academy. All rights reserved.</p>
            </div>
        </body>
        </html>
        """

        subject = f"Fee Payment Reminder - {academy_name}"

        # Send via Zoho Mail API
        return send_mail_via_zoho_api(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            from_address="donotreply@trackmyacademy.com"
        )

    except Exception as e:
        logger.error(f"Failed to send automated fee reminder: {e}")
        raise


# ============================================================================
# TESTING & VALIDATION HELPER
# ============================================================================

def test_zoho_mail_api_connection() -> Dict[str, Any]:
    """
    Test Zoho Mail API connection and configuration.

    Validates:
    - OAuth credentials are configured
    - Access token can be obtained
    - Account ID can be fetched

    Returns:
        dict: Test results with status and details
    """
    results = {
        "success": False,
        "steps": {}
    }

    try:
        # Step 1: Check credentials
        logger.info("Step 1: Checking OAuth credentials...")
        if not ZOHO_CLIENT_ID or not ZOHO_CLIENT_SECRET or not ZOHO_REFRESH_TOKEN:
            results["steps"]["credentials"] = "FAILED - Missing credentials"
            return results
        results["steps"]["credentials"] = "OK"

        # Step 2: Test access token
        logger.info("Step 2: Testing access token refresh...")
        access_token = get_access_token()
        results["steps"]["access_token"] = f"OK - Token obtained ({len(access_token)} chars)"

        # Step 3: Test account ID
        logger.info("Step 3: Fetching account ID...")
        account_id = get_account_id()
        results["steps"]["account_id"] = f"OK - Account ID: {account_id}"

        results["success"] = True
        logger.info("✅ Zoho Mail API connection test passed!")

    except Exception as e:
        results["error"] = str(e)
        logger.error(f"❌ Zoho Mail API connection test failed: {e}")

    return results


# ============================================================================
# EXAMPLE USAGE IN CRON JOB
# ============================================================================

"""
Example usage in a cron job or scheduler:

```python
from zoho_mail_api import send_automated_fee_reminder
from datetime import datetime

# Inside your cron job function:
def send_daily_fee_reminders():
    # Fetch overdue fees from database
    overdue_fees = db.student_fees.find({
        "status": "due",
        "due_date": {"$lt": datetime.utcnow()}
    })

    for fee in overdue_fees:
        try:
            # Get player details
            player = db.players.find_one({"id": fee["player_id"]})
            academy = db.academies.find_one({"id": fee["academy_id"]})

            # Send automated reminder
            send_automated_fee_reminder(
                to_email=player["email"],
                player_name=player["name"],
                academy_name=academy["name"],
                fee_amount=fee["amount"],
                due_date=fee["due_date"],
                frequency=fee.get("frequency", "monthly")
            )

            # Log the send
            print(f"✅ Sent reminder to {player['email']}")

        except Exception as e:
            print(f"❌ Failed to send reminder to {player.get('email', 'unknown')}: {e}")
            continue
```
"""
