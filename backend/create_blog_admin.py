import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from supabase import create_client
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
from pathlib import Path

async def create_admin():
    # Load environment variables
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')

    # Admin credentials
    ADMIN_EMAIL = "blogs@trackmyacademy.com"
    ADMIN_PASSWORD = "trackmyacademy@2025"
    ADMIN_NAME = "Blog Admin"

    # Connect to Supabase
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
        return

    supabase = create_client(supabase_url, supabase_key)

    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
    if not mongo_url:
        print("❌ Error: MONGO_URL not found in .env")
        return

    client = AsyncIOMotorClient(
        mongo_url,
        tls=True if mongo_url.startswith("mongodb+srv://") else False
    )
    db = client[os.environ.get('DB_NAME', 'attendance_tracker')]

    try:
        print("Creating blog admin user...")
        print(f"Email: {ADMIN_EMAIL}")

        # Step 1: Create Supabase user
        print("\n1️⃣ Creating Supabase user...")
        auth_response = supabase.auth.admin.create_user({
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "email_confirm": True,
            "user_metadata": {
                "name": ADMIN_NAME,
                "role": "blog_admin"
            }
        })

        supabase_user_id = auth_response.user.id
        print(f"✅ Supabase user created with ID: {supabase_user_id}")

        # Step 2: Create MongoDB document
        print("\n2️⃣ Creating MongoDB document in blog_writers collection...")
        admin_doc = {
            "id": str(uuid.uuid4()),
            "supabase_user_id": supabase_user_id,
            "name": ADMIN_NAME,
            "email": ADMIN_EMAIL,
            "bio": "Blog Administrator",
            "role": "admin",
            "profile_photo_url": None,
            "created_at": datetime.utcnow(),
            "is_active": True
        }

        await db.blog_writers.insert_one(admin_doc)
        print(f"✅ MongoDB document created")

        print("\n" + "="*60)
        print("🎉 BLOG ADMIN USER CREATED SUCCESSFULLY!")
        print("="*60)
        print(f"📧 Email: {ADMIN_EMAIL}")
        print(f"🔑 Password: {ADMIN_PASSWORD}")
        print(f"🔗 Login at: /internal/blog-login")
        print("="*60)
        print("\nYou can now login and start managing the blog system!")

    except Exception as e:
        print(f"\n❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
