import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Zoho SMTP Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.zoho.in')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', 'donotreply@trackmyacademy.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', 'Y5EDkVMjn7pE')

def send_fee_reminder_email(
    to_email: str,
    player_name: str,
    academy_name: str,
    fee_amount: float,
    due_date: datetime,
    frequency: str = 'monthly'
) -> bool:
    """
    Send fee reminder email using Zoho SMTP

    Args:
        to_email: Recipient email address
        player_name: Name of the player
        academy_name: Name of the academy
        fee_amount: Amount due
        due_date: Payment due date
        frequency: Fee frequency (monthly, quarterly, etc.)

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Fee Payment Reminder - {academy_name}'
        msg['From'] = f'Track My Academy <{SMTP_USER}>'
        msg['To'] = to_email

        # Format due date
        due_date_str = due_date.strftime('%B %d, %Y')

        # Calculate days until due
        days_until_due = (due_date - datetime.utcnow()).days
        urgency_text = ""
        if days_until_due < 0:
            urgency_text = f"⚠️ This payment is {abs(days_until_due)} days overdue."
        elif days_until_due == 0:
            urgency_text = "⚠️ This payment is due today!"
        elif days_until_due <= 3:
            urgency_text = f"⚠️ This payment is due in {days_until_due} day(s)."
        else:
            urgency_text = f"This payment is due in {days_until_due} days."

        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
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
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
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
                .button {{
                    display: inline-block;
                    background: #0ea5e9;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Fee Payment Reminder</h1>
            </div>

            <div class="content">
                <p>Dear {player_name},</p>

                <p>This is a friendly reminder about your upcoming fee payment for <strong>{academy_name}</strong>.</p>

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

        # Create plain text version
        text_body = f"""
        Fee Payment Reminder - {academy_name}

        Dear {player_name},

        This is a friendly reminder about your upcoming fee payment.

        Payment Details:
        Amount: ₹{fee_amount:,.2f}
        Frequency: {frequency.capitalize()}
        Due Date: {due_date_str}

        {urgency_text}

        Please ensure your payment is completed by the due date to avoid any interruption in your training.

        If you have already made the payment, please disregard this reminder.

        For any questions or payment assistance, please contact your academy administration.

        Best regards,
        {academy_name}

        ---
        This is an automated message from Track My Academy.
        Please do not reply to this email.
        """

        # Attach both versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Connect to Zoho SMTP server and send email
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Fee reminder email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send fee reminder email to {to_email}: {e}")
        return False


def send_bulk_fee_reminders(recipients: list) -> dict:
    """
    Send fee reminders to multiple recipients

    Args:
        recipients: List of dicts with email details

    Returns:
        dict: Summary of sent/failed emails
    """
    sent = 0
    failed = 0

    for recipient in recipients:
        try:
            success = send_fee_reminder_email(
                to_email=recipient['email'],
                player_name=recipient['player_name'],
                academy_name=recipient['academy_name'],
                fee_amount=recipient['fee_amount'],
                due_date=recipient['due_date'],
                frequency=recipient.get('frequency', 'monthly')
            )

            if success:
                sent += 1
            else:
                failed += 1

        except Exception as e:
            logger.error(f"Error processing reminder for {recipient.get('email')}: {e}")
            failed += 1

    return {
        'sent': sent,
        'failed': failed,
        'total': len(recipients)
    }


def send_manual_email(
    to_email: str,
    subject: str,
    content: str
) -> bool:
    """
    Send manual custom email using Zoho SMTP

    Args:
        to_email: Recipient email address
        subject: Email subject
        content: Email content (supports HTML)

    Returns:
        bool: True if email sent successfully, False otherwise

    Raises:
        Exception: If email fails to send with detailed error message
    """
    try:
        # Validate SMTP configuration
        if not SMTP_USER or not SMTP_PASSWORD:
            error_msg = "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables."
            logger.error(error_msg)
            raise Exception(error_msg)

        if not to_email or '@' not in to_email:
            error_msg = f"Invalid recipient email address: {to_email}"
            logger.error(error_msg)
            raise Exception(error_msg)

        logger.info(f"Preparing to send manual email to {to_email}")
        logger.info(f"SMTP Config - Host: {SMTP_HOST}, Port: {SMTP_PORT}, User: {SMTP_USER}")

        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f'Track My Academy <{SMTP_USER}>'
        msg['To'] = to_email

        # Create plain text version (strip HTML tags)
        import re
        text_content = re.sub('<[^<]+?>', '', content)

        # Attach both versions
        part1 = MIMEText(text_content, 'plain', 'utf-8')
        part2 = MIMEText(content, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)

        # Connect to Zoho SMTP server and send email
        try:
            logger.info(f"Connecting to SMTP server {SMTP_HOST}:{SMTP_PORT}...")
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                logger.info("Connected to SMTP server, attempting login...")
                server.login(SMTP_USER, SMTP_PASSWORD)
                logger.info("Login successful, sending message...")
                server.send_message(msg)
                logger.info(f"Message sent successfully to {to_email}")

        except smtplib.SMTPAuthenticationError as auth_error:
            error_msg = f"SMTP Authentication failed. Please check SMTP username and password. Error: {str(auth_error)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        except smtplib.SMTPConnectError as conn_error:
            error_msg = f"Failed to connect to SMTP server {SMTP_HOST}:{SMTP_PORT}. Error: {str(conn_error)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        except smtplib.SMTPException as smtp_error:
            error_msg = f"SMTP error occurred: {str(smtp_error)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        except ConnectionError as conn_error:
            error_msg = f"Network connection error: {str(conn_error)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        logger.info(f"✅ Manual email sent successfully to {to_email}")
        return True

    except Exception as e:
        error_msg = f"Failed to send manual email to {to_email}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        # Re-raise the exception so the API can return proper error message
        raise
