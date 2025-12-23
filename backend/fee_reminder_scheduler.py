import asyncio
import logging
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from email_utils import send_fee_reminder_email

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI') or "mongodb://localhost:27017"
client = AsyncIOMotorClient(mongo_url)
db = client.track_my_academy


async def send_automatic_fee_reminders():
    """
    Automated task to send fee reminders for academies with automatic reminder setting
    Runs daily and sends reminders to players with unpaid fees
    Respects 24-hour cooldown period
    """
    try:
        logger.info("Starting automatic fee reminder job...")

        # Get all academies with automatic reminder setting
        academies_with_auto_reminders = await db.academy_settings.find({
            "fee_reminder_type": "automatic"
        }).to_list(None)

        academy_ids = [setting["academy_id"] for setting in academies_with_auto_reminders]

        if not academy_ids:
            logger.info("No academies with automatic reminders enabled")
            return

        logger.info(f"Found {len(academy_ids)} academies with automatic reminders enabled")

        # Get all unpaid fees for these academies
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)

        unpaid_fees = await db.student_fees.find({
            "academy_id": {"$in": academy_ids},
            "status": {"$in": ["due", "pending"]},
            "$or": [
                {"last_reminder_sent": {"$exists": False}},
                {"last_reminder_sent": None},
                {"last_reminder_sent": {"$lt": twenty_four_hours_ago}}
            ]
        }).to_list(None)

        if not unpaid_fees:
            logger.info("No fees requiring reminders at this time")
            return

        logger.info(f"Found {len(unpaid_fees)} fees requiring reminders")

        # Process each fee
        sent_count = 0
        failed_count = 0

        for fee in unpaid_fees:
            try:
                # Get player info
                player = await db.players.find_one({"id": fee["player_id"]})
                if not player or not player.get("email"):
                    logger.warning(f"Skipping fee for player {fee['player_id']} - no email found")
                    continue

                # Get academy info
                academy = await db.academies.find_one({"id": fee["academy_id"]})
                if not academy:
                    logger.warning(f"Skipping fee for academy {fee['academy_id']} - academy not found")
                    continue

                # Send email
                email_sent = send_fee_reminder_email(
                    to_email=player["email"],
                    player_name=f"{player.get('first_name', '')} {player.get('last_name', '')}",
                    academy_name=academy.get("name", "Your Academy"),
                    fee_amount=fee["amount"],
                    due_date=fee["due_date"],
                    frequency=fee.get("frequency", "monthly")
                )

                if email_sent:
                    # Update last_reminder_sent timestamp
                    await db.student_fees.update_one(
                        {"player_id": fee["player_id"], "academy_id": fee["academy_id"]},
                        {"$set": {"last_reminder_sent": datetime.utcnow()}}
                    )

                    # Create in-app notification
                    notification = {
                        "id": str(__import__('uuid').uuid4()),
                        "player_id": fee["player_id"],
                        "academy_id": fee["academy_id"],
                        "type": "fee_reminder",
                        "title": "Fee Payment Reminder",
                        "message": f"Reminder: Your {fee.get('frequency', 'monthly')} fee of ₹{fee['amount']} is due on {fee['due_date'].strftime('%d %b %Y')}. Please make the payment at the earliest.",
                        "read": False,
                        "created_at": datetime.utcnow()
                    }
                    await db.notifications.insert_one(notification)

                    sent_count += 1
                    logger.info(f"Sent reminder to {player['email']} for fee of ₹{fee['amount']}")
                else:
                    failed_count += 1
                    logger.error(f"Failed to send reminder to {player['email']}")

            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing fee reminder for player {fee.get('player_id')}: {e}")

        logger.info(f"Automatic fee reminder job completed - Sent: {sent_count}, Failed: {failed_count}")

    except Exception as e:
        logger.error(f"Error in automatic fee reminder job: {e}")


async def run_scheduler():
    """
    Main scheduler loop - runs the reminder task daily
    """
    while True:
        try:
            # Run the reminder task
            await send_automatic_fee_reminders()

            # Wait for 24 hours before next run
            logger.info("Waiting 24 hours until next reminder job...")
            await asyncio.sleep(86400)  # 24 hours in seconds

        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")
            # Wait 1 hour before retry on error
            await asyncio.sleep(3600)


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Run the scheduler
    asyncio.run(run_scheduler())
