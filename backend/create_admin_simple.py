from supabase import create_client
import os
from dotenv import load_dotenv
import uuid
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Admin credentials
ADMIN_EMAIL = "blogs@trackmyacademy.com"
ADMIN_PASSWORD = "trackmyacademy@2025"
ADMIN_NAME = "Blog Admin"

print("Creating blog admin user...")
print(f"Email: {ADMIN_EMAIL}\n")

try:
    # Connect to Supabase
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
        exit(1)

    supabase = create_client(supabase_url, supabase_key)

    # Create Supabase user
    print("1️⃣ Creating Supabase user...")
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
    print(f"✅ Supabase user created with ID: {supabase_user_id}\n")

    # Generate MongoDB document
    admin_id = str(uuid.uuid4())

    print("2️⃣ MongoDB Insert Command:")
    print("\nRun this in your MongoDB (mongosh or Compass):\n")
    print("="*60)
    print(f"""
use attendance_tracker

db.blog_writers.insertOne({{
  "id": "{admin_id}",
  "supabase_user_id": "{supabase_user_id}",
  "name": "{ADMIN_NAME}",
  "email": "{ADMIN_EMAIL}",
  "bio": "Blog Administrator",
  "role": "admin",
  "profile_photo_url": null,
  "created_at": new Date(),
  "is_active": true
}})
""")
    print("="*60)

    print("\n🎉 Supabase user created successfully!")
    print("\n📋 Next steps:")
    print("1. Copy the MongoDB command above")
    print("2. Run it in your MongoDB")
    print(f"3. Login at /internal/blog-login with:")
    print(f"   Email: {ADMIN_EMAIL}")
    print(f"   Password: {ADMIN_PASSWORD}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
