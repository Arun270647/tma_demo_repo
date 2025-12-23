import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

async def check_admin():
    # Load environment
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')

    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
    client = AsyncIOMotorClient(
        mongo_url,
        tls=True if mongo_url.startswith("mongodb+srv://") else False
    )
    db = client[os.environ.get('DB_NAME', 'attendance_tracker')]

    try:
        print("Checking blog_writers collection...\n")

        # Check if collection exists
        collections = await db.list_collection_names()
        if 'blog_writers' not in collections:
            print("❌ ERROR: 'blog_writers' collection does NOT exist!")
            print("\nYou need to create the MongoDB document first.")
            return

        print("✅ Collection 'blog_writers' exists")

        # Find the admin user
        admin = await db.blog_writers.find_one({"email": "blogs@trackmyacademy.com"})

        if not admin:
            print("\n❌ ERROR: Admin user NOT found in MongoDB!")
            print("\nThe user with email 'blogs@trackmyacademy.com' does not exist in blog_writers collection.")
            print("\nYou need to insert the MongoDB document as instructed.")

            # Show all users for debugging
            all_writers = await db.blog_writers.find().to_list(length=10)
            if all_writers:
                print(f"\nFound {len(all_writers)} writer(s) in database:")
                for writer in all_writers:
                    print(f"  - {writer.get('email')} (role: {writer.get('role')})")
            else:
                print("\nThe blog_writers collection is EMPTY.")
        else:
            print("\n✅ Admin user FOUND in MongoDB!")
            print(f"\nDetails:")
            print(f"  Email: {admin.get('email')}")
            print(f"  Name: {admin.get('name')}")
            print(f"  Role: {admin.get('role')}")
            print(f"  Supabase User ID: {admin.get('supabase_user_id')}")
            print(f"  Is Active: {admin.get('is_active')}")

            if admin.get('role') != 'admin':
                print(f"\n⚠️  WARNING: Role is '{admin.get('role')}', should be 'admin'")

            if not admin.get('is_active'):
                print(f"\n⚠️  WARNING: User is not active!")

            print("\n" + "="*60)
            print("Copy this Supabase User ID and verify it matches in Supabase:")
            print(admin.get('supabase_user_id'))
            print("="*60)

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_admin())
