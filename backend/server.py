# backend/server.py
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client
import shutil
import aiofiles
from contextlib import asynccontextmanager
from utils.player_update_ops import build_player_update_ops
from blog_api import blog_router, setup_blog_dependencies
from email_utils import send_fee_reminder_email as send_email_reminder_smtp, send_manual_email
from zoho_mail_api import send_automated_fee_reminder as send_email_reminder_zoho

# ---- Add your class AFTER imports ----
class RefreshRequest(BaseModel):
    refresh_token: str

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
@app.get("/")
async def root():
    return {"status": "ok"}

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads" / "logos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI') or "mongodb://localhost:27017"
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=int(os.getenv("MONGO_MAX_POOL", "10")),
    minPoolSize=0,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    retryWrites=True,
    tls=True if mongo_url.startswith("mongodb+srv://") else False,
)
db = client[os.environ.get('DB_NAME', 'attendance_tracker')]

# Supabase connection
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_KEY')
supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')

supabase: Client | None = None
supabase_admin: Client | None = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
if supabase_url and supabase_service_key:
    supabase_admin = create_client(supabase_url, supabase_service_key)

# Stripe configuration - REMOVED for manual billing
# stripe_api_key = os.environ.get('STRIPE_API_KEY')
# if not stripe_api_key:
#     raise ValueError("Missing STRIPE_API_KEY environment variable")
stripe_api_key = None  # Disabled for manual billing

# Security
security = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks can go here
    # Initialize blog API dependencies
    setup_blog_dependencies(db, supabase, supabase_admin)
    print("Application startup complete.")
    yield
    # Shutdown tasks can go here
    print("Application shutdown initiated.")
    client.close()
    print("MongoDB client connection closed.")

# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Mount static files for uploaded logos on main app but with /api prefix
app.mount("/api/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

# Subscription Plans Configuration (Backend-defined for security) - INR Pricing
SUBSCRIPTION_PLANS = {
    "starter_monthly": {
        "name": "Starter Monthly",
        "price": 2499.00,  # ₹2,499 per month
        "billing_cycle": "monthly",
        "currency": "inr",
        "player_limit": 50,
        "coach_limit": 5,
        "features": ["Basic player management", "Coach assignment", "Performance tracking", "Email support"]
    },
    "starter_annual": {
        "name": "Starter Annual",
        "price": 24990.00,  # ₹24,990 per year (2 months free)
        "billing_cycle": "annual",
        "currency": "inr",
        "player_limit": 50,
        "coach_limit": 5,
        "features": ["Basic player management", "Coach assignment", "Performance tracking", "Email support"]
    },
    "pro_monthly": {
        "name": "Pro Monthly", 
        "price": 4999.00,  # ₹4,999 per month
        "billing_cycle": "monthly",
        "currency": "inr",
        "player_limit": 200,
        "coach_limit": 20,
        "features": ["Advanced analytics", "Custom reports", "API access", "Priority support", "Mobile app access"]
    },
    "pro_annual": {
        "name": "Pro Annual",
        "price": 49990.00,  # ₹49,990 per year (2 months free)
        "billing_cycle": "annual",
        "currency": "inr", 
        "player_limit": 200,
        "coach_limit": 20,
        "features": ["Advanced analytics", "Custom reports", "API access", "Priority support", "Mobile app access"]
    },
    "enterprise_monthly": {
        "name": "Enterprise Monthly",
        "price": 12499.00,  # ₹12,499 per month
        "billing_cycle": "monthly",
        "currency": "inr",
        "player_limit": 1000,
        "coach_limit": 100,
        "features": ["Unlimited everything", "Custom integrations", "Dedicated support", "Training sessions", "White labeling"]
    },
    "enterprise_annual": {
        "name": "Enterprise Annual", 
        "price": 124990.00,  # ₹1,24,990 per year (2 months free)
        "billing_cycle": "annual",
        "currency": "inr",
        "player_limit": 1000,
        "coach_limit": 100,
        "features": ["Unlimited everything", "Custom integrations", "Dedicated support", "Training sessions", "White labeling"]
    }
}


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Authentication Models
class SignUpRequest(BaseModel):
    email: str
    password: str
    academy_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None

class SignInRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user: dict
    session: dict
    message: str

class UserResponse(BaseModel):
    user: Optional[dict] = None
    role: Optional[str] = None    # <-- add this line
    message: str

class SupabaseHealthResponse(BaseModel):
    status: str
    supabase_url: str
    connection: str

# Academy Models
class Academy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None
    logo_url: Optional[str] = None
    player_limit: int = 50  # Default limit for player accounts
    coach_limit: int = 10   # Default limit for coach accounts
    status: str = "pending"  # pending, approved, rejected, suspended
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    supabase_user_id: Optional[str] = None

class AcademyCreate(BaseModel):
    name: str
    owner_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None
    player_limit: Optional[int] = 50
    coach_limit: Optional[int] = 10

class AcademyUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    sports_type: Optional[str] = None
    player_limit: Optional[int] = None
    coach_limit: Optional[int] = None
    status: Optional[str] = None

# Demo Request Models
class DemoRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: str
    phone: Optional[str] = None
    academy_name: str
    location: str
    sports_type: str
    current_students: Optional[str] = None
    message: Optional[str] = None
    status: str = "pending"  # pending, contacted, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DemoRequestCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    academy_name: str
    location: str
    sports_type: str
    current_students: Optional[str] = None
    message: Optional[str] = None

class DemoRequestUpdate(BaseModel):
    status: str  # pending, contacted, closed

# Subscription and Billing Models
class SubscriptionPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "Basic", "Pro", "Enterprise", "Custom"
    price_monthly: Optional[float] = None  # USD monthly price
    price_annual: Optional[float] = None   # USD annual price (with discount)
    features: List[str] = []               # List of features included
    player_limit: int = 50                 # Maximum players allowed
    coach_limit: int = 10                  # Maximum coaches allowed
    is_custom: bool = False                # True for custom pricing plans
    is_active: bool = True                 # Plan availability
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AcademySubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    plan_id: str
    billing_cycle: str = "monthly"  # monthly, annual
    amount: float                   # Custom amount for this academy
    currency: str = "inr"           # Changed to INR for Indian market
    status: str = "active"          # active, cancelled, suspended, pending, trial
    current_period_start: datetime
    current_period_end: datetime
    auto_renew: bool = True
    notes: Optional[str] = None     # Admin notes about subscription
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    subscription_id: Optional[str] = None
    amount: float
    currency: str = "inr"           # Changed to INR
    payment_method: str             # GPay, Cash, Bank Transfer, UPI, etc.
    payment_status: str = "pending" # pending, paid, failed, cancelled
    payment_date: Optional[datetime] = None  # Actual payment date
    billing_cycle: Optional[str] = None
    description: Optional[str] = None
    admin_notes: Optional[str] = None # Admin notes about the payment
    receipt_url: Optional[str] = None # URL to receipt/proof if uploaded
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionCreateRequest(BaseModel):
    academy_id: str
    billing_cycle: str  # monthly, annual
    custom_amount: Optional[float] = None  # For custom pricing

# Manual Billing Models
class ManualPaymentCreate(BaseModel):
    academy_id: str
    amount: float
    payment_method: str  # GPay, Cash, Bank Transfer, UPI, etc.
    payment_date: datetime
    billing_cycle: Optional[str] = None
    description: Optional[str] = None
    admin_notes: Optional[str] = None
    receipt_url: Optional[str] = None

class ManualPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_method: Optional[str] = None
    payment_date: Optional[datetime] = None
    payment_status: Optional[str] = None  # pending, paid, failed, cancelled
    billing_cycle: Optional[str] = None
    description: Optional[str] = None
    admin_notes: Optional[str] = None
    receipt_url: Optional[str] = None

class SubscriptionManualCreate(BaseModel):
    academy_id: str
    plan_id: str  # Reference to SUBSCRIPTION_PLANS key
    billing_cycle: str  # monthly, annual
    custom_amount: Optional[float] = None  # Override plan price if needed
    current_period_start: datetime
    current_period_end: datetime
    status: str = "active"  # active, cancelled, suspended, pending, trial
    auto_renew: bool = True
    notes: Optional[str] = None

class SubscriptionManualUpdate(BaseModel):
    plan_id: Optional[str] = None
    billing_cycle: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    auto_renew: Optional[bool] = None
    notes: Optional[str] = None

class PaymentSessionRequest(BaseModel):
    academy_id: str
    billing_cycle: str  # monthly, annual
    origin_url: str     # Frontend origin for success/cancel URLs

# Sport-based Position Mapping
SPORT_POSITIONS = {
    "Football": ["Goalkeeper", "Center Back", "Left Back", "Right Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Winger", "Right Winger", "Striker", "Center Forward"],
    "Cricket": ["Wicket Keeper", "Batsman", "All Rounder", "Fast Bowler", "Spin Bowler", "Opening Batsman", "Middle Order", "Finisher"],
    "Basketball": ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    "Tennis": ["Singles Player", "Doubles Player"],
    "Badminton": ["Singles Player", "Doubles Player"],
    "Hockey": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    "Volleyball": ["Setter", "Outside Hitter", "Middle Blocker", "Opposite Hitter", "Libero", "Defensive Specialist"],
    "Swimming": ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"],
    "Athletics": ["Sprinter", "Middle Distance", "Long Distance", "Jumper", "Thrower"],
    "Other": ["Player"]
}

# Sport-specific Performance Categories (5 categories per sport)
SPORT_PERFORMANCE_CATEGORIES = {
    "Football": [
        "Technical Skills",
        "Physical Fitness", 
        "Tactical Awareness",
        "Mental Strength",
        "Teamwork"
    ],
    "Cricket": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Strength", 
        "Teamwork",
        "Match Awareness"
    ],
    "Basketball": [
        "Shooting & Scoring",
        "Defense & Rebounding",
        "Ball Handling",
        "Court Vision",
        "Physical Fitness"
    ],
    "Tennis": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Strength",
        "Match Strategy",
        "Consistency"
    ],
    "Swimming": [
        "Technique",
        "Speed & Endurance",
        "Mental Focus",
        "Training Discipline",
        "Race Strategy"
    ],
    "Badminton": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Focus",
        "Court Coverage",
        "Game Strategy"
    ],
    "Athletics": [
        "Technical Form",
        "Physical Fitness",
        "Mental Strength",
        "Training Discipline",
        "Competition Performance"
    ],
    "Hockey": [
        "Technical Skills",
        "Physical Fitness",
        "Tactical Awareness",
        "Mental Strength",
        "Teamwork"
    ],
    "Volleyball": [
        "Technical Skills",
        "Physical Fitness",
        "Tactical Awareness",
        "Mental Strength",
        "Teamwork"
    ],
    "Other": [
        "Technical Skills",
        "Physical Fitness",
        "Mental Strength",
        "Performance Consistency",
        "Training Attitude"
    ]
}

# Individual vs Team Sports Classification
INDIVIDUAL_SPORTS = ["Tennis", "Swimming", "Badminton", "Athletics"]
TEAM_SPORTS = ["Football", "Cricket", "Basketball", "Hockey", "Volleyball"]

# Training Days and Batches
TRAINING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
TRAINING_BATCHES = ["Morning", "Evening", "Both"]

# Helper Functions
def calculate_age_from_dob(date_of_birth: str) -> Optional[int]:
    """Calculate age from date of birth string (YYYY-MM-DD format)"""
    try:
        from datetime import date
        birth_date = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return age
    except (ValueError, TypeError):
        return None

def is_individual_sport(sport: str) -> bool:
    """Check if a sport is individual or team-based"""
    return sport in INDIVIDUAL_SPORTS

def get_sport_performance_categories(sport: str) -> List[str]:
    """Get performance categories for a specific sport"""
    return SPORT_PERFORMANCE_CATEGORIES.get(sport, SPORT_PERFORMANCE_CATEGORIES["Other"])

# Core calculation helpers for radar analytics
async def _get_active_player_ids(academy_id: str) -> List[str]:
    players = await db.players.find({"academy_id": academy_id, "status": "active"}).to_list(length=None)
    return [p.get("id") for p in players if p.get("id")]

def _aggregate_academy_ratings(records: List[Dict[str, Any]], default_categories: List[str]) -> Dict[str, Any]:
    sums: Dict[str, float] = {}
    counts: Dict[str, int] = {}
    rated_count = 0
    for record in records:
        if not isinstance(record, dict):
            continue
        ratings = record.get("performance_ratings") or {}
        if isinstance(ratings, dict):
            if any(v is not None for v in ratings.values()):
                rated_count += 1
            for category, value in ratings.items():
                if value is None:
                    continue
                try:
                    v = float(value)
                except (TypeError, ValueError):
                    continue
                sums[category] = sums.get(category, 0.0) + v
                counts[category] = counts.get(category, 0) + 1
    categories = []
    for cat in default_categories:
        avg = (sums.get(cat, 0.0) / counts.get(cat, 1)) if counts.get(cat, 0) > 0 else 0.0
        categories.append({"name": cat, "average": round(avg, 2), "count": counts.get(cat, 0)})
    return {"categories": categories, "rated_count": rated_count}

def _aggregate_sport_ratings(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    per_sport_sums: Dict[str, Dict[str, float]] = {}
    per_sport_counts: Dict[str, Dict[str, int]] = {}
    per_sport_record_counts: Dict[str, int] = {}
    per_sport_rated_counts: Dict[str, int] = {}
    for record in records:
        if not isinstance(record, dict):
            continue
        sport_val = record.get("sport")
        sport = sport_val if isinstance(sport_val, str) and sport_val else "Other"
        ratings = record.get("performance_ratings") or {}
        if sport not in per_sport_sums:
            per_sport_sums[sport] = {}
            per_sport_counts[sport] = {}
            per_sport_record_counts[sport] = 0
            per_sport_rated_counts[sport] = 0
        per_sport_record_counts[sport] += 1
        if isinstance(ratings, dict):
            if any(v is not None for v in ratings.values()):
                per_sport_rated_counts[sport] += 1
            for category, value in ratings.items():
                if value is None:
                    continue
                try:
                    v = float(value)
                except (TypeError, ValueError):
                    continue
                per_sport_sums[sport][category] = per_sport_sums[sport].get(category, 0.0) + v
                per_sport_counts[sport][category] = per_sport_counts[sport].get(category, 0) + 1
    result_sports: List[Dict[str, Any]] = []
    for sport, sums in per_sport_sums.items():
        counts = per_sport_counts.get(sport, {})
        default_categories = get_sport_performance_categories(sport)
        categories: List[Dict[str, Any]] = []
        for cat in default_categories:
            avg = (sums.get(cat, 0.0) / counts.get(cat, 1)) if counts.get(cat, 0) > 0 else 0.0
            categories.append({"name": cat, "average": round(avg, 2), "count": counts.get(cat, 0)})
        overall_avg = round(sum(c["average"] for c in categories) / len(categories), 2) if categories else 0.0
        result_sports.append({
            "sport": sport,
            "categories": categories,
            "overall_average": overall_avg,
            "sample_size": per_sport_record_counts.get(sport, 0),
            "rated_count": per_sport_rated_counts.get(sport, 0)
        })
    result_sports.sort(key=lambda s: s["sport"])
    return result_sports

def generate_default_password() -> str:
    """Generate a default password for new players"""
    import random
    import string
    # Generate an 8-character password with letters and numbers
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(8))

async def create_player_supabase_account(email: str, password: str, player_data: dict) -> Optional[str]:
    """Create a Supabase account for a player"""
    try:
        # Create player account using admin privileges
        user_metadata = {
            'player_name': f"{player_data.get('first_name', '')} {player_data.get('last_name', '')}",
            'academy_id': player_data.get('academy_id'),
            'role': 'player'
        }
        
        response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Skip email confirmation for admin-created accounts
            "user_metadata": user_metadata
        })
        
        if response.user:
            return response.user.id
        return None
    except Exception as e:
        logger.error(f"Failed to create Supabase account for player: {e}")
        return None

async def create_coach_supabase_account(email: str, password: str, coach_data: dict) -> Optional[str]:
    """Create a Supabase account for a coach"""
    try:
        # Create coach account using admin privileges
        user_metadata = {
            'coach_name': f"{coach_data.get('first_name', '')} {coach_data.get('last_name', '')}",
            'academy_id': coach_data.get('academy_id'),
            'role': 'coach'
        }
        
        response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Skip email confirmation for admin-created accounts
            "user_metadata": user_metadata
        })
        
        if response.user:
            return response.user.id
        return None
    except Exception as e:
        logger.error(f"Failed to create Supabase account for coach: {e}")
        return None

# Enhanced Player and Coach Management Models
class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str  # Links player to academy
    coach_id: Optional[str] = None  # Links player to assigned coach
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None  # Store as string for simplicity
    age: Optional[int] = None  # Auto-calculated from date_of_birth
    gender: Optional[str] = None     
    sport: Optional[str] = None  
    position: Optional[str] = None  # Position based on sport (not needed for individual sports)
    registration_number: str = None  
    height: Optional[str] = None  # e.g., "5'10"
    weight: Optional[str] = None  # e.g., "70 kg"
    photo_url: Optional[str] = None  # Player photo URL
    training_days: List[str] = []  # Days when player trains
    training_batch: Optional[str] = None  # Morning, Evening, Both
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    status: str = "active"  # active, inactive, suspended
    # Player Authentication Fields
    has_login: bool = False  # Whether player has login credential
    default_password: Optional[str] = None  # Auto-generated default password
    password_changed: bool = False  # Whether player has changed default password
    supabase_user_id: Optional[str] = None  # Links to Supabase auth user
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PlayerCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None  # Will be auto-calculated if date_of_birth provided
    gender: str  # Required: Male, Female, Other
    sport: str  # Required: Sport type
    position: Optional[str] = None  # Optional for individual sports
    registration_number: str = None 
    height: Optional[str] = None
    weight: Optional[str] = None
    photo_url: Optional[str] = None
    training_days: List[str] = []
    training_batch: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    coach_id: Optional[str] = None  # Assign player to coach

class PlayerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None  # Will be auto-calculated if date_of_birth provided
    gender: Optional[str] = None
    sport: Optional[str] = None
    position: Optional[str] = None
    registration_number: Optional[str] = None  
    height: Optional[str] = None
    weight: Optional[str] = None
    photo_url: Optional[str] = None
    training_days: Optional[List[str]] = None
    training_batch: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    status: Optional[str] = None
    coach_id: Optional[str] = None  # Assign/reassign player to coach

class BulkPlayerUpdate(BaseModel):
    player_ids: List[str]
    coach_id: Optional[str] = None  # None for unassigning

class PlayerResponse(BaseModel):
    """
    Response model for Player with authentication fields for Academy dashboard
    Includes password fields (only visible until player changes password)
    """
    id: str
    academy_id: str
    coach_id: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    sport: Optional[str] = None
    position: Optional[str] = None
    registration_number: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    photo_url: Optional[str] = None
    training_days: List[str] = []
    training_batch: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None
    status: str = "active"
    # Authentication fields (for academy dashboard)
    has_login: bool = False
    default_password: Optional[str] = None
    password_changed: bool = False
    # Excluded: supabase_user_id (always keep this private)
    created_at: datetime
    updated_at: datetime

class Coach(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str  # Links coach to academy
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    sports: List[str] = []  # List of sports the coach handles
    specialization: Optional[str] = None  # Fitness, Technical, Goalkeeping, etc.
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None  # Certifications, degrees, etc.
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"  # active, inactive, suspended
    # Coach Authentication Fields
    has_login: bool = False
    default_password: Optional[str] = None
    password_changed: bool = False
    supabase_user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CoachCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    sports: List[str] = []  # Sports the coach handles
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bio: Optional[str] = None

class CoachUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    sports: Optional[List[str]] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None

class CoachResponse(BaseModel):
    """
    Response model for Coach with authentication fields for Academy dashboard
    Includes password fields (only visible until coach changes password)
    """
    id: str
    academy_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    sports: List[str] = []
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"
    # Authentication fields (for academy dashboard)
    has_login: bool = False
    temporary_password: Optional[str] = None  # Alias for default_password
    has_reset_password: bool = False  # Alias for password_changed
    # Excluded: supabase_user_id (always keep this private)
    created_at: datetime
    updated_at: datetime

# Notification Model
class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    coach_id: str
    academy_id: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced Attendance and Performance Tracking Models
class PlayerAttendance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    academy_id: str
    date: str  # YYYY-MM-DD format
    present: bool
    # sport: str  # Sport type for performance categories
    # Sport-specific performance ratings (1-10 scale for each category)
    performance_ratings: Dict[str, Optional[int]] = {}  # e.g., {"Technical Skills": 8, "Physical Fitness": 7, ...}
    notes: Optional[str] = None
    marked_by: str  # User ID who marked attendance
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PlayerAttendanceCreate(BaseModel):
    player_id: str
    date: str
    present: bool
    sport: str  # Required for performance categories
    performance_ratings: Dict[str, Optional[int]] = {}  # Sport-specific ratings
    notes: Optional[str] = None

class PlayerAttendanceUpdate(BaseModel):
    present: Optional[bool] = None
    performance_ratings: Optional[Dict[str, Optional[int]]] = None
    notes: Optional[str] = None

# Simplified PlayerPerformanceAnalytics Model
class PlayerPerformanceAnalytics(BaseModel):
    player_id: str
    player_name: str
    sport: str
    total_sessions: int
    attended_sessions: int
    attendance_percentage: float
    average_rating: Optional[float] = None
    performance_trend: List[Dict[str, Any]] = []
    monthly_stats: Dict[str, Dict[str, Any]] = {}

class AttendanceMarkingRequest(BaseModel):
    date: str
    attendance_records: List[PlayerAttendanceCreate]

# New Performance Metrics Model
class PerformanceMetricsCreate(BaseModel):
    player_id: str
    date: str
    speed: int = Field(..., ge=1, le=10)
    agility: int = Field(..., ge=1, le=10)
    movement: int = Field(..., ge=1, le=10)
    pace: int = Field(..., ge=1, le=10)
    stamina: int = Field(..., ge=1, le=10)
    overall_rating: int = Field(..., ge=1, le=10)
    notes: Optional[str] = None

# Player -> Coach rating submission model
class CoachRatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=10)
    notes: Optional[str] = None

# Sport Positions API Response Model (Legacy - for backward compatibility)
class SportPositionsResponse(BaseModel):
    sports: Dict[str, List[str]]
    training_days: List[str]
    training_batches: List[str]

# Enhanced Sport Configuration API Response Model
class SportConfigResponse(BaseModel):
    sports: Dict[str, List[str]]  # sport -> positions
    performance_categories: Dict[str, List[str]]  # sport -> categories
    individual_sports: List[str]
    team_sports: List[str]
    training_days: List[str]
    training_batches: List[str]

# Theme Preference Models
class ThemePreference(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    theme: str = "light"  # light, dark
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Announcement Models
class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    title: str
    content: str
    priority: str = "medium"  # low, medium, high, urgent
    target_audience: str = "all"  # all, players, coaches, specific_player
    target_player_id: Optional[str] = None  # For player-specific announcements
    is_active: bool = True
    created_by: str  # User ID who created the announcement
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "medium"
    target_audience: str = "all"
    target_player_id: Optional[str] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    target_audience: Optional[str] = None
    target_player_id: Optional[str] = None
    is_active: Optional[bool] = None

# Player Authentication Models
class PlayerSignInRequest(BaseModel):
    email: str
    password: str

class PlayerAuthResponse(BaseModel):
    player: dict
    session: dict
    message: str

class PlayerPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class CoachPasswordChangeRequest(BaseModel):
    new_password: str

# Student Fee Models
class StudentFeeCreate(BaseModel):
    amount: float
    frequency: str
    due_date: str
    status: Optional[str] = "due"
    notes: Optional[str] = None

# Training Plan Models
class TrainingPlanDrill(BaseModel):
    name: str
    description: Optional[str] = None
    duration: str
    focus_area: Optional[str] = None

class TrainingPlanGoal(BaseModel):
    description: str
    target_date: Optional[str] = None

class TrainingPlanCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sport: str
    batch_id: Optional[str] = None
    start_date: str
    end_date: str
    schedule: Optional[Dict[str, Any]] = {}
    drills: List[TrainingPlanDrill] = []
    goals: List[TrainingPlanGoal] = []

# Security Helper Functions

# Rate Limiting Storage (in-memory, for production use Redis or similar)
from collections import defaultdict
from datetime import timedelta

rate_limit_storage = defaultdict(list)

def check_rate_limit(identifier: str, max_requests: int = 5, window_minutes: int = 60) -> tuple[bool, str]:
    """
    SECURITY FIX #6: Simple rate limiting to prevent abuse
    Returns (is_allowed, error_message)
    """
    now = datetime.utcnow()
    window_start = now - timedelta(minutes=window_minutes)

    # Clean old entries
    rate_limit_storage[identifier] = [
        timestamp for timestamp in rate_limit_storage[identifier]
        if timestamp > window_start
    ]

    # Check if limit exceeded
    if len(rate_limit_storage[identifier]) >= max_requests:
        return False, f"Rate limit exceeded. Maximum {max_requests} requests per {window_minutes} minutes."

    # Add current request
    rate_limit_storage[identifier].append(now)
    return True, ""

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    SECURITY FIX #5: Validate password strength requirements
    Returns (is_valid, error_message)
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"

    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"

    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"

    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"

    # Check for special characters
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character"

    # Check for common weak passwords
    weak_passwords = {'password123!', 'admin123!@#', '123456789!@#', 'qwerty123!@#'}
    if password.lower() in weak_passwords:
        return False, "Password is too common, please choose a stronger password"

    return True, ""

async def validate_image_file(file_content: bytes, filename: str) -> bool:
    """
    SECURITY FIX: Validate image files using magic numbers (file signatures)
    Prevents content-type spoofing attacks by checking actual file content
    """
    # Image file signatures (magic numbers)
    IMAGE_SIGNATURES = {
        b'\xFF\xD8\xFF': 'jpg',  # JPEG
        b'\x89PNG\r\n\x1a\n': 'png',  # PNG
        b'GIF87a': 'gif',  # GIF87a
        b'GIF89a': 'gif',  # GIF89a
        b'RIFF': 'webp',  # WebP (also check for WEBP after RIFF)
        b'BM': 'bmp',  # BMP
    }

    # Check file signature
    for signature, file_type in IMAGE_SIGNATURES.items():
        if file_content.startswith(signature):
            # Additional check for WebP
            if signature == b'RIFF' and len(file_content) >= 12:
                if file_content[8:12] == b'WEBP':
                    return True
                else:
                    continue
            return True

    # If no valid signature found, reject the file
    return False

# Authentication helper functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        return None
    
    try:
        # Verify JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        return user.user if user.user else None
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return None

async def get_academy_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get authenticated user info with academy details"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify JWT token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = user_response.user
        
        # Look up academy information for this user
        academy = await db.academies.find_one({"supabase_user_id": user.id})
        
        if not academy:
            # Check if this is a super admin
            if user.email == "admin@trackmyacademy.com":
                return {
                    "user": user,
                    "role": "super_admin",
                    "academy_id": None,
                    "academy_name": None
                }
            else:
                raise HTTPException(status_code=403, detail="No academy associated with this user")
        
        return {
            "user": user,
            "role": "academy_user",
            "academy_id": academy["id"],
            "academy_name": academy["name"],
            "academy": academy
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def require_academy_user(user_info = Depends(get_academy_user_info)):
    """Ensure user is an academy user (not super admin)"""
    if user_info["role"] != "academy_user":
        raise HTTPException(status_code=403, detail="Academy user access required")
    return user_info

async def get_player_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get authenticated player user info"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify JWT token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = user_response.user
        
        # Look up player information for this user
        player = await db.players.find_one({"supabase_user_id": user.id})
        
        if not player:
            raise HTTPException(status_code=403, detail="No player profile associated with this user")
        
        return {
            "user": user,
            "role": "player",
            "player_id": player["id"],
            "academy_id": player["academy_id"],
            "player": player
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Player authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def require_player_user(user_info = Depends(get_player_user_info)):
    """Ensure user is a player"""
    if user_info["role"] != "player":
        raise HTTPException(status_code=403, detail="Player access required")
    return user_info

async def get_coach_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get authenticated coach user info"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify JWT token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = user_response.user
        
        # Look up coach information for this user
        coach = await db.coaches.find_one({"supabase_user_id": user.id})
        
        if not coach:
            raise HTTPException(status_code=403, detail="No coach profile associated with this user")
        
        return {
            "user": user,
            "role": "coach",
            "coach_id": coach["id"],
            "academy_id": coach["academy_id"],
            "coach": coach
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def require_coach_user(user_info = Depends(get_coach_user_info)):
    """Ensure user is a coach"""
    if user_info["role"] != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    return user_info

async def require_super_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Ensure user is a super admin - CRITICAL SECURITY FUNCTION"""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Verify JWT token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = user_response.user
        user_email = user.email.lower() if user.email else ""

        # Check if user is super admin (hardcoded check for security)
        # In production, this should be checked against a database role table
        if user_email != 'admin@trackmyacademy.com':
            raise HTTPException(status_code=403, detail="Super admin access required")

        return {
            "user": user,
            "role": "super_admin",
            "academy_id": None,
            "academy_name": None,
            "permissions": ['manage_all_academies', 'view_all_data', 'create_academies', 'manage_billing']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Super admin authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# Supabase Health Check
@api_router.get("/supabase/health", response_model=SupabaseHealthResponse)
async def supabase_health_check():
    try:
        # Test connection by getting user (will return None for anon key)
        test_response = supabase.auth.get_user()
        return SupabaseHealthResponse(
            status="healthy",
            supabase_url=supabase_url,
            connection="active"
        )
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        # SECURITY FIX: Generic error message to prevent information disclosure
        raise HTTPException(status_code=500, detail="Service connection failed")

# File Upload Endpoints
@api_router.post("/upload/logo")
async def upload_academy_logo(file: UploadFile = File(...)):
    try:
        # Read file content first for validation
        content = await file.read()

        # SECURITY FIX #2: Validate actual file content using magic numbers
        if not await validate_image_file(content, file.filename):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # SECURITY FIX #4: Use pathlib for safe file extension extraction
        file_extension = Path(file.filename).suffix.lower().lstrip('.')

        # Whitelist allowed extensions
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Generate unique filename
        unique_filename = f"{str(uuid.uuid4())}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Return the URL path with /api prefix
        logo_url = f"/api/uploads/logos/{unique_filename}"
        return {"logo_url": logo_url, "message": "Logo uploaded successfully"}
        
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")

@api_router.post("/upload/player-photo")
async def upload_player_photo(file: UploadFile = File(...), user_info = Depends(require_academy_user)):
    try:
        # Read file content first for validation
        content = await file.read()

        # SECURITY FIX #2: Validate actual file content using magic numbers
        if not await validate_image_file(content, file.filename):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # SECURITY FIX #4: Use pathlib for safe file extension extraction
        file_extension = Path(file.filename).suffix.lower().lstrip('.')

        # Whitelist allowed extensions
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Generate unique filename with academy prefix
        academy_id = user_info["academy_id"]
        unique_filename = f"player_{academy_id}_{str(uuid.uuid4())}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Return the URL path with /api prefix
        photo_url = f"/api/uploads/logos/{unique_filename}"
        return {"photo_url": photo_url, "message": "Player photo uploaded successfully"}
        
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload player photo")

# Sport and Position Configuration Endpoints
@api_router.get("/sports/positions", response_model=SportPositionsResponse)
async def get_sport_positions():
    """Get available sports, positions, training days, and batches (Legacy endpoint)"""
    return SportPositionsResponse(
        sports=SPORT_POSITIONS,
        training_days=TRAINING_DAYS,
        training_batches=TRAINING_BATCHES
    )

@api_router.get("/sports/config", response_model=SportConfigResponse)
async def get_sport_config():
    """Get enhanced sports configuration including performance categories and sport types"""
    return SportConfigResponse(
        sports=SPORT_POSITIONS,
        performance_categories=SPORT_PERFORMANCE_CATEGORIES,
        individual_sports=INDIVIDUAL_SPORTS,
        team_sports=TEAM_SPORTS,
        training_days=TRAINING_DAYS,
        training_batches=TRAINING_BATCHES
    )

# Authentication Endpoints

# DISABLED: Public signup endpoint - SaaS model requires admin-controlled user creation
# @api_router.post("/auth/signup", response_model=AuthResponse)
# async def signup(request: SignUpRequest):
#     # This endpoint is disabled for SaaS model
#     # Only admin can create academy accounts through admin dashboard
#     raise HTTPException(status_code=403, detail="Public signup disabled. Contact administrator for academy registration.")

# Admin-Only Academy Creation Endpoint (Enhanced with new fields)
@api_router.post("/admin/create-academy", response_model=AuthResponse)
async def admin_create_academy(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    owner_name: str = Form(...),
    phone: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    sports_type: Optional[str] = Form(None),
    player_limit: int = Form(50),
    coach_limit: int = Form(10),
    logo: Optional[UploadFile] = File(None),
    admin_user = Depends(require_super_admin)
):
    """Admin-only endpoint to create new academy accounts with Supabase authentication"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # SECURITY FIX #5: Validate password strength
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Handle logo upload if provided
        logo_url = None
        if logo:
            # Read file content for validation
            content = await logo.read()

            # SECURITY FIX #2: Validate actual file content using magic numbers
            if not await validate_image_file(content, logo.filename):
                raise HTTPException(status_code=400, detail="Invalid image file")

            # SECURITY FIX #4: Use pathlib for safe file extension extraction
            file_extension = Path(logo.filename).suffix.lower().lstrip('.') if logo.filename else "png"

            # Whitelist allowed extensions
            allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
            if file_extension not in allowed_extensions:
                raise HTTPException(status_code=400, detail="File type not allowed")

            # Generate unique filename
            unique_filename = f"{str(uuid.uuid4())}.{file_extension}"
            file_path = UPLOAD_DIR / unique_filename

            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)

            logo_url = f"/api/uploads/logos/{unique_filename}"
        
        # Prepare user metadata
        user_metadata = {
            'academy_name': name,
            'owner_name': owner_name,
            'phone': phone,
            'location': location,
            'sports_type': sports_type,
            'player_limit': player_limit,
            'coach_limit': coach_limit
        }
        
        # Create academy account using admin privileges
        response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Skip email confirmation for admin-created accounts
            "user_metadata": user_metadata
        })
        
        if response.user:
            # Store academy data in MongoDB
            academy_data = Academy(
                name=name,
                owner_name=owner_name,
                email=email,
                phone=phone,
                location=location,
                sports_type=sports_type,
                logo_url=logo_url,
                player_limit=player_limit,
                coach_limit=coach_limit,
                status="approved",  # Admin-created academies are auto-approved
                supabase_user_id=response.user.id
            )
            
            await db.academies.insert_one(academy_data.dict())
            
            return AuthResponse(
                user=response.user.model_dump() if hasattr(response.user, 'model_dump') else dict(response.user),
                session={},  # No session for admin-created users
                message="Academy account created successfully by admin"
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to create academy account")
            
    except Exception as e:
        logger.error(f"Admin academy creation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Academy Management Endpoints
@api_router.get("/admin/academies", response_model=List[Academy])
async def get_academies(admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to list all academies"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency
        academies = await db.academies.find().to_list(1000)
        return [Academy(**academy) for academy in academies]
    except Exception as e:
        logger.error(f"Error fetching academies: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academies")

@api_router.put("/admin/academies/{academy_id}", response_model=Academy)
async def update_academy(academy_id: str, academy_update: AcademyUpdate, admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to update academy information"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Find the academy
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Update fields
        update_data = academy_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await db.academies.update_one(
                {"id": academy_id},
                {"$set": update_data}
            )
        
        # Return updated academy
        updated_academy = await db.academies.find_one({"id": academy_id})
        return Academy(**updated_academy)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating academy: {e}")
        raise HTTPException(status_code=500, detail="Failed to update academy")

@api_router.delete("/admin/academies/{academy_id}")
async def delete_academy(academy_id: str, admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to delete an academy"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Find the academy
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Delete from MongoDB
        await db.academies.delete_one({"id": academy_id})
        
        # TODO: Also delete the Supabase user if needed
        # if academy.get('supabase_user_id'):
        #     try:
        #         supabase_admin.auth.admin.delete_user(academy['supabase_user_id'])
        #     except Exception as e:
        #         logger.warning(f"Failed to delete Supabase user: {e}")
        
        return {"message": "Academy deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting academy: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete academy")

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: SignInRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if response.user:
            return AuthResponse(
                user=response.user.model_dump() if hasattr(response.user, 'model_dump') else dict(response.user),
                session=response.session.model_dump() if response.session and hasattr(response.session, 'model_dump') else dict(response.session) if response.session else {},
                message="Login successful"
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.post("/auth/logout")
async def logout(current_user = Depends(get_current_user)):
    try:
        supabase.auth.sign_out()
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@api_router.get("/auth/user", response_model=UserResponse)
async def get_user(current_user = Depends(get_current_user)):
    if current_user:
        # Convert user object to dictionary
        user_dict = current_user.model_dump() if hasattr(current_user, 'model_dump') else dict(current_user)
        
        # Determine user role and academy information
        user_email = user_dict.get('email', '')
        user_id = user_dict.get('id', '')

        user_email_lower = user_email.lower()
        # SECURITY FIX: Removed environment-dependent check
        # Super admin status should be consistent across all environments
        is_super_admin = (user_email_lower == 'admin@trackmyacademy.com')
        
        # Initialize role info
        role_info = {
            'role': 'super_admin' if is_super_admin else 'academy_user',
            'academy_id': None,
            'academy_name': None,
            'permissions': []
        }
        
        if is_super_admin:
            role_info['permissions'] = ['manage_all_academies', 'view_all_data', 'create_academies', 'manage_billing']
        else:
            # Check if user is a coach
            coach = await db.coaches.find_one({"supabase_user_id": user_id})
            if coach:
                role_info['role'] = 'coach'
                role_info['coach_id'] = coach['id']
                role_info['academy_id'] = coach['academy_id']
                role_info['permissions'] = ['view_assigned_players', 'mark_attendance', 'add_performance']
            else:
                # Check if user is a player
                player = await db.players.find_one({"supabase_user_id": user_id})
                if player:
                    role_info['role'] = 'player'
                    role_info['player_id'] = player['id']
                    role_info['academy_id'] = player['academy_id']
                    role_info['permissions'] = ['view_own_data', 'view_attendance', 'view_performance']
                else:
                    # Find academy for this user
                    academy = await db.academies.find_one({"supabase_user_id": user_id})
                    if academy:
                        role_info['academy_id'] = academy['id']
                        role_info['academy_name'] = academy['name']
                        role_info['permissions'] = ['manage_own_academy', 'create_coaches', 'view_own_data']

        # Add role info to user data
        user_dict['role_info'] = role_info

        # Extract role directly for top-level field
        role = role_info.get("role")

        return UserResponse(
            user=user_dict,
            role=role,
            message="User retrieved successfully"
        )
    else:
        return UserResponse(
            user=None,
            message="No authenticated user"
        )

@api_router.post("/auth/refresh", response_model=AuthResponse)
async def refresh_token(input: RefreshRequest):
    try:
        refreshed = supabase.auth.refresh_session(input.refresh_token)
        if refreshed.session:
            return {
                "user": dict(refreshed.user) if hasattr(refreshed.user, "__iter__") else refreshed.user,
                "session": {
                    "access_token": refreshed.session.access_token,
                    "refresh_token": refreshed.session.refresh_token,
                    "expires_at": refreshed.session.expires_at,
                },
                "message": "Token refreshed successfully",
            }
        raise HTTPException(status_code=401, detail="Failed to refresh token")
    except Exception as e:
        logger.error(f"Refresh error: {e}")
        raise HTTPException(status_code=401, detail="Failed to refresh token")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# System Overview Models
class SystemStats(BaseModel):
    total_academies: int
    active_academies: int
    pending_academies: int
    total_demo_requests: int
    pending_demo_requests: int
    recent_activity_count: int

class RecentActivity(BaseModel):
    id: str
    type: str  # academy_created, demo_request, academy_approved, etc.
    description: str
    timestamp: datetime
    status: str  # success, pending, info

class RecentAcademy(BaseModel):
    id: str
    name: str
    owner_name: str
    location: str
    sports_type: str
    status: str
    created_at: datetime

class SystemOverview(BaseModel):
    stats: SystemStats
    recent_activities: List[RecentActivity]
    recent_academies: List[RecentAcademy]
    server_status: str

# System Overview Endpoint
@api_router.get("/admin/system-overview", response_model=SystemOverview)
async def get_system_overview(admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to get system-wide statistics"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Get academy stats
        academies = await db.academies.find().to_list(1000)
        total_academies = len(academies)
        active_academies = len([a for a in academies if a.get('status') == 'approved'])
        pending_academies = len([a for a in academies if a.get('status') == 'pending'])
        
        # Get demo request stats
        demo_requests = await db.demo_requests.find().to_list(1000)
        total_demo_requests = len(demo_requests)
        pending_demo_requests = len([d for d in demo_requests if d.get('status') == 'pending'])
        
        # Create stats
        stats = SystemStats(
            total_academies=total_academies,
            active_academies=active_academies,
            pending_academies=pending_academies,
            total_demo_requests=total_demo_requests,
            pending_demo_requests=pending_demo_requests,
            recent_activity_count=len(academies) + len(demo_requests)
        )
        
        # Get recent activities (last 10)
        recent_activities = []
        
        # Recent academy activities
        recent_academy_activities = await db.academies.find().sort("created_at", -1).limit(5).to_list(5)
        for academy in recent_academy_activities:
            activity = RecentActivity(
                id=str(uuid.uuid4()),
                type="academy_created",
                description=f"New academy registration: {academy.get('name', 'Unknown')}",
                timestamp=academy.get('created_at', datetime.utcnow()),
                status="success" if academy.get('status') == 'approved' else "pending"
            )
            recent_activities.append(activity)
        
        # Recent demo request activities
        recent_demo_activities = await db.demo_requests.find().sort("created_at", -1).limit(5).to_list(5)
        for demo in recent_demo_activities:
            activity = RecentActivity(
                id=str(uuid.uuid4()),
                type="demo_request",
                description=f"Demo request from: {demo.get('academy_name', 'Unknown Academy')}",
                timestamp=demo.get('created_at', datetime.utcnow()),
                status=demo.get('status', 'pending')
            )
            recent_activities.append(activity)
        
        # Sort by timestamp (newest first) and limit to 10
        recent_activities.sort(key=lambda x: x.timestamp, reverse=True)
        recent_activities = recent_activities[:10]
        
        # Get recently added academies (last 5)
        recent_academies_data = await db.academies.find().sort("created_at", -1).limit(5).to_list(5)
        recent_academies = []
        for academy in recent_academies_data:
            academy_obj = RecentAcademy(
                id=academy.get('id', str(uuid.uuid4())),
                name=academy.get('name', 'Unknown'),
                owner_name=academy.get('owner_name', 'Unknown'),
                location=academy.get('location', 'Unknown'),
                sports_type=academy.get('sports_type', 'Unknown'),
                status=academy.get('status', 'pending'),
                created_at=academy.get('created_at', datetime.utcnow())
            )
            recent_academies.append(academy_obj)
        
        # Server status (always healthy for now)
        server_status = "healthy"
        
        overview = SystemOverview(
            stats=stats,
            recent_activities=recent_activities,
            recent_academies=recent_academies,
            server_status=server_status
        )
        
        return overview
        
    except Exception as e:
        logger.error(f"Error fetching system overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system overview")

# Demo Request Endpoints

# Public endpoint for demo requests (no authentication required)
@api_router.post("/demo-requests", response_model=DemoRequest)
async def create_demo_request(request: DemoRequestCreate, http_request: Request):
    """Public endpoint to submit demo requests - rate limited to prevent spam"""
    try:
        # SECURITY FIX #6: Rate limiting to prevent abuse
        # Use email as identifier for rate limiting
        identifier = f"demo_request:{request.email.lower()}"
        is_allowed, error_msg = check_rate_limit(identifier, max_requests=3, window_minutes=1440)  # 3 requests per 24 hours

        if not is_allowed:
            raise HTTPException(status_code=429, detail=error_msg)

        demo_request_data = DemoRequest(**request.dict())
        await db.demo_requests.insert_one(demo_request_data.dict())

        logger.info(f"Demo request created: {demo_request_data.full_name} - {demo_request_data.academy_name}")
        return demo_request_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating demo request: {e}")
        raise HTTPException(status_code=500, detail="Failed to create demo request")

# Admin endpoints for managing demo requests
@api_router.get("/admin/demo-requests", response_model=List[DemoRequest])
async def get_demo_requests(
    skip: int = 0,
    limit: int = 50,
    admin_user = Depends(require_super_admin)
):
    """Admin-only endpoint to list demo requests with pagination"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # SECURITY FIX MEDIUM #4: Add pagination to prevent large data transfers
        # Limit maximum page size to prevent resource exhaustion
        limit = min(limit, 100)  # Cap at 100 records per request

        demo_requests = await db.demo_requests.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        return [DemoRequest(**request) for request in demo_requests]
    except Exception as e:
        logger.error(f"Error fetching demo requests: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch demo requests")

@api_router.put("/admin/demo-requests/{request_id}", response_model=DemoRequest)
async def update_demo_request(request_id: str, request_update: DemoRequestUpdate, admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to update demo request status"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Find the request
        demo_request = await db.demo_requests.find_one({"id": request_id})
        if not demo_request:
            raise HTTPException(status_code=404, detail="Demo request not found")
        
        # Update fields
        update_data = request_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await db.demo_requests.update_one(
                {"id": request_id},
                {"$set": update_data}
            )
        
        # Return updated request
        updated_request = await db.demo_requests.find_one({"id": request_id})
        return DemoRequest(**updated_request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating demo request: {e}")
        raise HTTPException(status_code=500, detail="Failed to update demo request")

# ========== BILLING AND SUBSCRIPTION ENDPOINTS ==========

# Get Available Subscription Plans
@api_router.get("/billing/plans")
async def get_subscription_plans():
    """Get all available subscription plans with pricing"""
    try:
        return {"plans": SUBSCRIPTION_PLANS}
    except Exception as e:
        logger.error(f"Error fetching subscription plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription plans")

# Get Academy Subscription Status
@api_router.get("/billing/academy/{academy_id}/subscription")
async def get_academy_subscription(academy_id: str, current_user = Depends(get_current_user)):
    """Get current subscription status for an academy"""
    try:
        # TODO: Add proper authorization (admin or academy owner)
        
        subscription = await db.academy_subscriptions.find_one({"academy_id": academy_id})
        if not subscription:
            return {"subscription": None, "status": "no_subscription"}
        
        return {"subscription": AcademySubscription(**subscription)}
    except Exception as e:
        logger.error(f"Error fetching academy subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription")

# DISABLED: Stripe payment session creation - removed for manual billing
# @api_router.post("/billing/create-payment-session")
# async def create_payment_session(request: PaymentSessionRequest, http_request: Request, current_user = Depends(get_current_user)):
#     """Create Stripe payment session for academy subscription"""
#     try:
#         # Check if Stripe is enabled
#         if not stripe_api_key:
#             raise HTTPException(status_code=503, detail="Payment processing is currently disabled. Please contact support for manual billing.")
#         
#         # Validate academy exists
#         academy = await db.academies.find_one({"id": request.academy_id})
#         if not academy:
#             raise HTTPException(status_code=404, detail="Academy not found")
#         
#         # Get plan pricing - support custom amounts
#         plan_key = f"starter_{request.billing_cycle}"  # Default plan
#         if plan_key not in SUBSCRIPTION_PLANS:
#             raise HTTPException(status_code=400, detail="Invalid billing cycle")
#         
#         # For now, use default pricing - in future, support custom amounts per academy
#         amount = SUBSCRIPTION_PLANS[plan_key]["price"]
#         
#         # Initialize Stripe
#         host_url = str(http_request.base_url).rstrip('/')
#         webhook_url = f"{host_url}/api/webhook/stripe"
#         stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
#         
#         # Build dynamic URLs from frontend origin
#         success_url = f"{request.origin_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
#         cancel_url = f"{request.origin_url}/billing/cancel"
#         
#         # Create checkout session
#         checkout_request = CheckoutSessionRequest(
#             amount=amount,
#             currency="usd",
#             success_url=success_url,
#             cancel_url=cancel_url,
#             metadata={
#                 "academy_id": request.academy_id,
#                 "billing_cycle": request.billing_cycle,
#                 "source": "academy_subscription",
#                 "plan": plan_key
#             }
#         )
#         
#         session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
#         
#         # Create payment transaction record
#         payment_transaction = PaymentTransaction(
#             academy_id=request.academy_id,
#             session_id=session.session_id,
#             amount=amount,
#             currency="usd",
#             payment_status="pending",
#             stripe_status="pending",
#             billing_cycle=request.billing_cycle,
#             description=f"Subscription - {SUBSCRIPTION_PLANS[plan_key]['name']}",
#             metadata=checkout_request.metadata
#         )
#         
#         await db.payment_transactions.insert_one(payment_transaction.dict())
#         
#         logger.info(f"Payment session created for academy {request.academy_id}: {session.session_id}")
#         return {"checkout_url": session.url, "session_id": session.session_id}
#         
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error creating payment session: {e}")
#         raise HTTPException(status_code=500, detail="Failed to create payment session")

# DISABLED: Stripe payment status check - removed for manual billing
# @api_router.get("/billing/payment-status/{session_id}")
# async def check_payment_status(session_id: str, http_request: Request):
#     """Check the status of a payment session and update subscription if paid"""
#     try:
#         # Check if Stripe is enabled
#         if not stripe_api_key:
#             raise HTTPException(status_code=503, detail="Payment processing is currently disabled. Please contact support for manual billing.")
#         
#         # Initialize Stripe
#         host_url = str(http_request.base_url).rstrip('/')
#         webhook_url = f"{host_url}/api/webhook/stripe"
#         stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
#         
#         # Get payment status from Stripe
#         checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
#         
#         # Find payment transaction
#         payment_transaction = await db.payment_transactions.find_one({"session_id": session_id})
#         if not payment_transaction:
#             raise HTTPException(status_code=404, detail="Payment transaction not found")
#         
#         # Update payment transaction status
#         update_data = {
#             "payment_status": checkout_status.payment_status,
#             "stripe_status": checkout_status.status,
#             "updated_at": datetime.utcnow()
#         }
#         
#         await db.payment_transactions.update_one(
#             {"session_id": session_id},
#             {"$set": update_data}
#         )
#         
#         # If payment is successful and not already processed
#         if checkout_status.payment_status == "paid" and payment_transaction.get("payment_status") != "paid":
#             await process_successful_payment(payment_transaction, checkout_status)
#         
#         return {
#             "payment_status": checkout_status.payment_status,
#             "status": checkout_status.status,
#             "amount_total": checkout_status.amount_total,
#             "currency": checkout_status.currency
#         }
#         
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error checking payment status: {e}")
#         raise HTTPException(status_code=500, detail="Failed to check payment status")

# DISABLED: Stripe payment processing function - removed for manual billing
# async def process_successful_payment(payment_transaction: dict, checkout_status: CheckoutStatusResponse):
#     """Process successful payment and create/update subscription"""
#     try:
#         academy_id = payment_transaction["academy_id"]
#         billing_cycle = payment_transaction["billing_cycle"]
#         
#         # Calculate subscription period
#         start_date = datetime.utcnow()
#         if billing_cycle == "monthly":
#             end_date = start_date + timedelta(days=30)
#         elif billing_cycle == "annual":
#             end_date = start_date + timedelta(days=365)
#         else:
#             raise ValueError(f"Invalid billing cycle: {billing_cycle}")
#         
#         # Check if academy already has a subscription
#         existing_subscription = await db.academy_subscriptions.find_one({"academy_id": academy_id})
#         
#         if existing_subscription:
#             # Update existing subscription
#             update_data = {
#                 "billing_cycle": billing_cycle,
#                 "amount": payment_transaction["amount"],
#                 "status": "active",
#                 "current_period_start": start_date,
#                 "current_period_end": end_date,
#                 "updated_at": start_date
#             }
#             
#             await db.academy_subscriptions.update_one(
#                 {"academy_id": academy_id},
#                 {"$set": update_data}
#             )
#             
#             logger.info(f"Updated subscription for academy {academy_id}")
#         else:
#             # Create new subscription
#             subscription = AcademySubscription(
#                 academy_id=academy_id,
#                 plan_id="starter",  # Default plan for now
#                 billing_cycle=billing_cycle,
#                 amount=payment_transaction["amount"],
#                 current_period_start=start_date,
#                 current_period_end=end_date,
#                 status="active"
#             )
#             
#             await db.academy_subscriptions.insert_one(subscription.dict())
#             logger.info(f"Created new subscription for academy {academy_id}")
#         
#     except Exception as e:
#         logger.error(f"Error processing successful payment: {e}")
#         raise

# DISABLED: Stripe webhook handler - removed for manual billing
# @api_router.post("/webhook/stripe")
# async def stripe_webhook(request: Request):
#     """Handle Stripe webhooks for payment events"""
#     try:
#         # Check if Stripe is enabled
#         if not stripe_api_key:
#             raise HTTPException(status_code=503, detail="Payment processing is currently disabled.")
#         
#         # Get request body as bytes
#         body = await request.body()
#         stripe_signature = request.headers.get("stripe-signature", "")
#         
#         # Initialize Stripe
#         host_url = str(request.base_url).rstrip('/')
#         webhook_url = f"{host_url}/api/webhook/stripe"
#         stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
#         
#         # Handle webhook
#         webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
#         
#         # Process webhook event based on type
#         if webhook_response.event_type in ["checkout.session.completed", "payment_intent.succeeded"]:
#             # Find and update payment transaction
#             payment_transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
#             if payment_transaction and payment_transaction.get("payment_status") != "paid":
#                 
#                 # Update payment status
#                 await db.payment_transactions.update_one(
#                     {"session_id": webhook_response.session_id},
#                     {"$set": {
#                         "payment_status": "paid",
#                         "stripe_status": "completed",
#                         "updated_at": datetime.utcnow()
#                     }}
#                 )
#                 
#                 # Process successful payment
#                 checkout_status = CheckoutStatusResponse(
#                     status="complete",
#                     payment_status="paid",
#                     amount_total=int(payment_transaction["amount"] * 100),  # Convert to cents
#                     currency=payment_transaction["currency"],
#                     metadata=webhook_response.metadata or {}
#                 )
#                 
#                 await process_successful_payment(payment_transaction, checkout_status)
#                 logger.info(f"Webhook processed: payment completed for session {webhook_response.session_id}")
#         
#         return {"status": "success"}
#         
#     except Exception as e:
#         logger.error(f"Error processing webhook: {e}")
#         raise HTTPException(status_code=500, detail="Webhook processing failed")

# Admin: Get All Subscriptions
@api_router.get("/admin/billing/subscriptions", response_model=List[AcademySubscription])
async def get_all_subscriptions(admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to get all academy subscriptions"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        subscriptions = await db.academy_subscriptions.find().to_list(1000)
        return [AcademySubscription(**sub) for sub in subscriptions]
    except Exception as e:
        logger.error(f"Error fetching subscriptions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscriptions")

# Admin: Get All Payment Transactions
@api_router.get("/admin/billing/transactions", response_model=List[PaymentTransaction])
async def get_payment_transactions(admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to get all payment transactions"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        transactions = await db.payment_transactions.find().sort("created_at", -1).to_list(1000)
        return [PaymentTransaction(**txn) for txn in transactions]
    except Exception as e:
        logger.error(f"Error fetching payment transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment transactions")

# Admin: Update Academy Subscription
@api_router.put("/admin/billing/academy/{academy_id}/subscription")
async def update_academy_subscription(
    academy_id: str,
    subscription_data: dict,
    admin_user = Depends(require_super_admin)
):
    """Admin-only endpoint to manually update academy subscription"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Check if academy exists
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Update subscription
        subscription_data["updated_at"] = datetime.utcnow()
        
        result = await db.academy_subscriptions.update_one(
            {"academy_id": academy_id},
            {"$set": subscription_data},
            upsert=True
        )
        
        # Get updated subscription
        updated_subscription = await db.academy_subscriptions.find_one({"academy_id": academy_id})
        
        return {"message": "Subscription updated successfully", "subscription": updated_subscription}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating academy subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to update subscription")

# ========== MANUAL BILLING ENDPOINTS ==========

# Admin: Create Manual Payment Record
@api_router.post("/admin/billing/payments/manual", response_model=PaymentTransaction)
async def create_manual_payment(payment_data: ManualPaymentCreate, admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to create manual payment records"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Verify academy exists
        academy = await db.academies.find_one({"id": payment_data.academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Create payment transaction
        payment_transaction = PaymentTransaction(
            academy_id=payment_data.academy_id,
            amount=payment_data.amount,
            currency="inr",
            payment_method=payment_data.payment_method,
            payment_date=payment_data.payment_date,
            payment_status="paid",  # Manual payments are typically already paid
            billing_cycle=payment_data.billing_cycle,
            description=payment_data.description,
            admin_notes=payment_data.admin_notes,
            receipt_url=payment_data.receipt_url
        )
        
        # Save to database
        await db.payment_transactions.insert_one(payment_transaction.dict())
        
        return payment_transaction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating manual payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create manual payment")

# Admin: Update Manual Payment Record
@api_router.put("/admin/billing/payments/{payment_id}", response_model=PaymentTransaction)
async def update_manual_payment(
    payment_id: str,
    payment_data: ManualPaymentUpdate,
    admin_user = Depends(require_super_admin)
):
    """Admin-only endpoint to update manual payment records"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Check if payment exists
        existing_payment = await db.payment_transactions.find_one({"id": payment_id})
        if not existing_payment:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        
        # Prepare update data (only include non-None fields)
        update_data = {k: v for k, v in payment_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"id": payment_id},
            {"$set": update_data}
        )
        
        # Get updated payment
        updated_payment = await db.payment_transactions.find_one({"id": payment_id})
        
        return PaymentTransaction(**updated_payment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating manual payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to update manual payment")

# Admin: Get Payment History for Academy
@api_router.get("/admin/billing/academy/{academy_id}/payments", response_model=List[PaymentTransaction])
async def get_academy_payment_history(academy_id: str, admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to get payment history for specific academy"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Verify academy exists
        academy = await db.academies.find_one({"id": academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Get payment history
        payments = await db.payment_transactions.find(
            {"academy_id": academy_id}
        ).sort("created_at", -1).to_list(1000)
        
        return [PaymentTransaction(**payment) for payment in payments]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy payment history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment history")

# Admin: Create Manual Subscription
@api_router.post("/admin/billing/subscriptions/manual", response_model=AcademySubscription)
async def create_manual_subscription(subscription_data: SubscriptionManualCreate, admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to create manual subscriptions"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Verify academy exists
        academy = await db.academies.find_one({"id": subscription_data.academy_id})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        
        # Verify plan exists
        if subscription_data.plan_id not in SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=404, detail="Subscription plan not found")
        
        # Get plan details
        plan = SUBSCRIPTION_PLANS[subscription_data.plan_id]
        
        # Determine amount (use custom amount or plan price)
        amount = subscription_data.custom_amount if subscription_data.custom_amount else plan["price"]
        
        # Create subscription
        subscription = AcademySubscription(
            academy_id=subscription_data.academy_id,
            plan_id=subscription_data.plan_id,
            billing_cycle=subscription_data.billing_cycle,
            amount=amount,
            currency="inr",
            status=subscription_data.status,
            current_period_start=subscription_data.current_period_start,
            current_period_end=subscription_data.current_period_end,
            auto_renew=subscription_data.auto_renew,
            notes=subscription_data.notes
        )
        
        # Save to database (upsert to replace existing subscription)
        await db.academy_subscriptions.update_one(
            {"academy_id": subscription_data.academy_id},
            {"$set": subscription.dict()},
            upsert=True
        )
        
        return subscription
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating manual subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to create manual subscription")

# Admin: Update Manual Subscription
@api_router.put("/admin/billing/subscriptions/{subscription_id}", response_model=AcademySubscription)
async def update_manual_subscription(
    subscription_id: str,
    subscription_data: SubscriptionManualUpdate,
    admin_user = Depends(require_super_admin)
):
    """Admin-only endpoint to update manual subscriptions"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Check if subscription exists
        existing_subscription = await db.academy_subscriptions.find_one({"id": subscription_id})
        if not existing_subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Prepare update data (only include non-None fields)
        update_data = {k: v for k, v in subscription_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # If plan_id is being updated, validate it exists and update amount if no custom amount
        if "plan_id" in update_data and update_data["plan_id"] not in SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=404, detail="Subscription plan not found")
        
        # Update subscription
        await db.academy_subscriptions.update_one(
            {"id": subscription_id},
            {"$set": update_data}
        )
        
        # Get updated subscription
        updated_subscription = await db.academy_subscriptions.find_one({"id": subscription_id})
        
        return AcademySubscription(**updated_subscription)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating manual subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to update manual subscription")

# Admin: Delete Payment Transaction
@api_router.delete("/admin/billing/payments/{payment_id}")
async def delete_payment_transaction(payment_id: str, admin_user = Depends(require_super_admin)):
    """Admin-only endpoint to delete payment transactions"""
    try:
        # SECURITY FIX: Now using require_super_admin dependency

        # Check if payment exists
        existing_payment = await db.payment_transactions.find_one({"id": payment_id})
        if not existing_payment:
            raise HTTPException(status_code=404, detail="Payment transaction not found")
        
        # Delete payment transaction
        await db.payment_transactions.delete_one({"id": payment_id})
        
        return {"message": "Payment transaction deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment transaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete payment transaction")

# ========== PLAYER MANAGEMENT ENDPOINTS ==========

# Get all players for an academy (Academy User)
@api_router.get("/academy/players", response_model=List[PlayerResponse])
async def get_academy_players(user_info = Depends(require_academy_user)):
    """Get all players for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get players for this academy
        players_cursor = db.players.find({"academy_id": academy_id})
        players = await players_cursor.to_list(length=None)
        
        return [Player(**player) for player in players]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy players: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch players")

# Create a new player (Academy User)
@api_router.post("/academy/players", response_model=Player)
async def create_player(player_data: PlayerCreate, user_info = Depends(require_academy_user)):
    """Create a new player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        academy = user_info["academy"]
        
        # Check if academy has reached player limit
        current_players = await db.players.count_documents({"academy_id": academy_id, "status": "active"})
        if current_players >= academy.get("player_limit", 50):
            raise HTTPException(
                status_code=400, 
                detail=f"Academy has reached maximum player limit of {academy.get('player_limit', 50)}"
            )
        
        # Check for duplicate registration number within academy (if provided)
        if player_data.registration_number:
            existing_registration = await db.players.find_one({
                "academy_id": academy_id,
                "registration_number": player_data.registration_number,
                "status": "active"
            })
            if existing_registration:
                raise HTTPException(
                    status_code=400,
                    detail=f"Registration number {player_data.registration_number} is already taken"
                )
        
        # Prepare player data with enhancements
        player_dict = player_data.dict()
        
        # Auto-calculate age from date of birth if provided
        if player_data.date_of_birth and not player_data.age:
            calculated_age = calculate_age_from_dob(player_data.date_of_birth)
            if calculated_age:
                player_dict["age"] = calculated_age
        
        # Validate sport-specific requirements
        if player_data.sport:
            # For individual sports, position is optional
            if is_individual_sport(player_data.sport) and not player_data.position:
                player_dict["position"] = None
            
            # Validate position against sport if provided
            if player_data.position and player_data.sport in SPORT_POSITIONS:
                valid_positions = SPORT_POSITIONS[player_data.sport]
                if player_data.position not in valid_positions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid position '{player_data.position}' for sport '{player_data.sport}'"
                    )
        
        # Auto-generate login credentials if email is provided
        supabase_user_id = None
        default_password = None
        has_login = False
        
        if player_data.email:
            # Generate default password
            default_password = generate_default_password()
            
            # Create Supabase account for player
            supabase_user_id = await create_player_supabase_account(
                player_data.email, 
                default_password, 
                {
                    "first_name": player_data.first_name,
                    "last_name": player_data.last_name,
                    "academy_id": academy_id
                }
            )
            
            if supabase_user_id:
                has_login = True
        
        # Create new player with authentication fields
        player = Player(
            academy_id=academy_id,
            has_login=has_login,
            default_password=default_password,
            password_changed=False,
            supabase_user_id=supabase_user_id,
            **player_dict
        )
        
        # Save to database
        await db.players.insert_one(player.dict())
        
        # Create notification if coach is assigned
        if player_data.coach_id:
            # Verify coach exists
            coach = await db.coaches.find_one({"id": player_data.coach_id, "academy_id": academy_id})
            if coach:
                notification = Notification(
                    coach_id=player_data.coach_id,
                    academy_id=academy_id,
                    message=f"A new player, {player_data.first_name} {player_data.last_name}, has been assigned to you."
                )
                await db.notifications.insert_one(notification.dict())
        
        return player
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating player: {e}")
        raise HTTPException(status_code=500, detail="Failed to create player")

@api_router.post("/academy/players/bulk-assign")
@api_router.post("/academy/players/bulk-assign/")
@api_router.put("/academy/players/bulk-assign")
@api_router.put("/academy/players/bulk-assign/")
async def bulk_assign_players(payload: BulkPlayerUpdate, user_info = Depends(require_academy_user)):
    """
    Assign or Unassign multiple players in a single database operation.
    Pass coach_id=None to unassign.
    """
    try:
        academy_id = user_info["academy_id"]

        if not payload.player_ids:
            return {"message": "No players provided", "modified_count": 0, "matched_count": 0}

        # Pre-check: find which players exist
        existing_cursor = db.players.find({"academy_id": academy_id, "id": {"$in": payload.player_ids}}, {"id": 1})
        existing = await existing_cursor.to_list(length=None)
        found_ids = {p.get("id") for p in existing}
        missing_ids = [pid for pid in payload.player_ids if pid not in found_ids]

        filter_query = {"id": {"$in": list(found_ids)}, "academy_id": academy_id}

        if payload.coach_id is None:
            update_query = {"$unset": {"coach_id": ""}, "$set": {"updated_at": datetime.utcnow()}}
        else:
            update_query = {"$set": {"coach_id": payload.coach_id, "updated_at": datetime.utcnow()}}

        result = await db.players.update_many(filter_query, update_query)

        action = "assigned" if payload.coach_id else "unassigned"
        response = {
            "message": f"Successfully {action} {result.modified_count} players.",
            "modified_count": result.modified_count,
            "matched_count": result.matched_count,
            "missing_ids": missing_ids,
        }
        if missing_ids:
            logger.warning(f"Bulk assign: {len(missing_ids)} player IDs not found for academy {academy_id}: {missing_ids[:10]}{'...' if len(missing_ids) > 10 else ''}")
        return response
    except Exception as e:
        logger.error(f"Bulk assign error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update players")

# Get specific player (Academy User)
@api_router.get("/academy/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: str, user_info = Depends(require_academy_user)):
    """Get specific player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find player
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")

        # Remove MongoDB _id field
        player.pop("_id", None)
        return PlayerResponse(**player)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player")

# Update player (Academy User)
@api_router.put("/academy/players/{player_id}", response_model=PlayerResponse)
async def update_player(player_id: str, player_data: PlayerUpdate, user_info = Depends(require_academy_user)):
    """Update specific player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if player exists
        existing_player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not existing_player:
            raise HTTPException(status_code=404, detail="Player not found")

        # Check for duplicate registration number ONLY if actually changing it and it's not empty
        if player_data.registration_number is not None and player_data.registration_number.strip() != "":
            # Only check if different from current registration number
            current_reg = existing_player.get("registration_number", "")
            if player_data.registration_number != current_reg:
                existing_registration = await db.players.find_one({
                    "academy_id": academy_id,
                    "registration_number": player_data.registration_number,
                    "status": "active",
                    "id": {"$ne": player_id}  # Exclude current player
                })
                if existing_registration:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Registration number {player_data.registration_number} is already taken"
                    )

        # Build update data and remove None values
        update_data = {k: v for k, v in player_data.dict().items() if v is not None}

        # SECURITY FIX MEDIUM #1: Explicitly exclude sensitive authentication fields
        # These fields should never be modified via API updates
        sensitive_fields = {'has_login', 'default_password', 'password_changed', 'supabase_user_id', 'id', 'academy_id', 'created_at'}
        for field in sensitive_fields:
            update_data.pop(field, None)

        # Validate position against sport if provided
        if player_data.sport:
            if update_data.get("position") and player_data.sport in SPORT_POSITIONS:
                valid_positions = SPORT_POSITIONS[player_data.sport]
                if update_data["position"] not in valid_positions:
                    raise HTTPException(status_code=400, detail=f"Invalid position '{update_data['position']}' for sport '{player_data.sport}'")

        # Check if coach is being assigned/changed
        old_coach_id = existing_player.get("coach_id")
        new_coach_id = player_data.coach_id

        # Build update operations with cleaned data
        update_ops = build_player_update_ops(existing_player, player_data, cleaned_update_data=update_data)
        
        await db.players.update_one(
            {"id": player_id, "academy_id": academy_id},
            update_ops
        )
        
        # Create notification if coach is assigned or changed
        if new_coach_id and new_coach_id != old_coach_id:
            # Verify coach exists
            coach = await db.coaches.find_one({"id": new_coach_id, "academy_id": academy_id})
            if coach:
                notification = Notification(
                    coach_id=new_coach_id,
                    academy_id=academy_id,
                    message=f"A new player, {existing_player['first_name']} {existing_player['last_name']}, has been assigned to you."
                )
                await db.notifications.insert_one(notification.dict())
        
        # Get updated player
        updated_player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        # Remove MongoDB _id field
        updated_player.pop("_id", None)
        return PlayerResponse(**updated_player)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating player {player_id}: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update player: {str(e)}")



# Delete player (Academy User)
@api_router.delete("/academy/players/{player_id}")
async def delete_player(player_id: str, user_info = Depends(require_academy_user)):
    """Delete specific player for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if player exists
        existing_player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not existing_player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Delete player
        await db.players.delete_one({"id": player_id, "academy_id": academy_id})
        
        return {"message": "Player deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting player: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete player")

# ========== ATTENDANCE AND PERFORMANCE TRACKING ENDPOINTS ==========

# Mark attendance for players (Academy User)
@api_router.post("/academy/attendance")
async def mark_attendance(attendance_request: AttendanceMarkingRequest, user_info = Depends(require_academy_user)):
    """Mark attendance for multiple players with performance ratings"""
    try:
        academy_id = user_info["academy_id"]
        marked_by = user_info["user"].id
        
        results = []
        for record in attendance_request.attendance_records:
            # Validate player belongs to academy
            player = await db.players.find_one({"id": record.player_id, "academy_id": academy_id})
            if not player:
                continue  # Skip invalid players
            
            # Check if attendance already exists for this date
            existing_attendance = await db.player_attendance.find_one({
                "player_id": record.player_id,
                "academy_id": academy_id,
                "date": record.date
            })
            
            # Get player's sport for performance categories
            player_sport = player.get("sport", "Other")
            
            attendance_data = {
                "player_id": record.player_id,
                "academy_id": academy_id,
                "date": record.date,
                "present": record.present,
                "sport": record.sport or player_sport,  # Use provided sport or player's sport
                "performance_ratings": record.performance_ratings or {},
                "notes": record.notes,
                "marked_by": marked_by,
                "created_at": datetime.utcnow(),
                "id": str(uuid.uuid4())
            }
            
            if existing_attendance:
                # Update existing attendance
                await db.player_attendance.update_one(
                    {"id": existing_attendance["id"]},
                    {"$set": {
                        "present": record.present,
                        "sport": record.sport or player_sport,
                        "performance_ratings": record.performance_ratings or {},
                        "notes": record.notes,
                        "marked_by": marked_by,
                        "updated_at": datetime.utcnow()
                    }}
                )
                results.append({"player_id": record.player_id, "status": "updated"})
            else:
                # Create new attendance record
                await db.player_attendance.insert_one(attendance_data)
                results.append({"player_id": record.player_id, "status": "created"})
        
        return {"message": "Attendance marked successfully", "results": results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark attendance")

# Get attendance for a specific date (Academy User)
@api_router.post("/academy/attendance/{date}")
async def get_attendance_by_date(date: str, user_info = Depends(require_academy_user)):
    """Get attendance records for a specific date"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get attendance records for the date
        attendance_cursor = db.player_attendance.find({
            "academy_id": academy_id,
            "date": date
        })
        attendance_records = await attendance_cursor.to_list(length=None)
        
        # Get player details for each attendance record
        results = []
        for record in attendance_records:
            # SECURITY FIX: Added academy_id check to prevent cross-academy data access
            player = await db.players.find_one({"id": record["player_id"], "academy_id": academy_id})
            if player:
                results.append({
                    "attendance_id": record["id"],
                    "player_id": record["player_id"],
                    "player_name": f"{player['first_name']} {player['last_name']}",
                    "present": record["present"],
                    "performance_ratings": record.get("performance_ratings", {}),
                    "notes": record.get("notes"),
                    "marked_at": record["created_at"]
                })
        
        return {"date": date, "attendance_records": results}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance")

# Get player performance analytics (Academy User) - SIMPLIFIED
@api_router.get("/academy/players/{player_id}/performance", response_model=PlayerPerformanceAnalytics)
async def get_player_performance(player_id: str, user_info = Depends(require_academy_user)):
    """Get simplified performance analytics for a specific player"""
    try:
        academy_id = user_info["academy_id"]
        
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        all_sessions_cursor = db.player_attendance.find({"player_id": player_id, "academy_id": academy_id})
        all_sessions = await all_sessions_cursor.to_list(length=None)

        total_sessions = len(all_sessions)
        attended_sessions_records = [s for s in all_sessions if s.get("present")]
        attended_sessions = len(attended_sessions_records)
        attendance_percentage = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0

        perf_cursor = db.performance_metrics.find({"player_id": player_id, "academy_id": academy_id})
        perf_records = await perf_cursor.to_list(length=None)

        all_ratings = [rec.get("overall_rating") for rec in perf_records if rec.get("overall_rating") is not None]
        average_rating = round(sum(all_ratings) / len(all_ratings), 2) if all_ratings else None

        performance_trend = sorted([
            {
                "date": rec["date"],
                "rating": rec.get("overall_rating"),
                "speed": rec.get("speed"),
                "agility": rec.get("agility"),
                "movement": rec.get("movement"),
                "pace": rec.get("pace"),
                "stamina": rec.get("stamina"),
                "notes": rec.get("notes", "")
            }
            for rec in perf_records
            if rec.get("overall_rating") is not None
        ], key=lambda x: x["date"])

        monthly_stats = {}
        perf_map = {rec["date"]: rec.get("overall_rating") for rec in perf_records if rec.get("overall_rating") is not None}
        for record in all_sessions:
            month_key = record["date"][:7]
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {"total_sessions": 0, "attended_sessions": 0, "ratings": []}
            monthly_stats[month_key]["total_sessions"] += 1
            if record.get("present"):
                monthly_stats[month_key]["attended_sessions"] += 1
                r = perf_map.get(record["date"]) 
                if r is not None:
                    monthly_stats[month_key]["ratings"].append(r)
        for month, stats in monthly_stats.items():
            stats["attendance_percentage"] = (stats["attended_sessions"] / stats["total_sessions"] * 100) if stats["total_sessions"] > 0 else 0
            stats["average_rating"] = round(sum(stats["ratings"]) / len(stats["ratings"]), 2) if stats["ratings"] else None
            del stats["ratings"]

        return PlayerPerformanceAnalytics(
            player_id=player_id,
            player_name=f"{player['first_name']} {player['last_name']}",
            sport=player.get("sport", "Other"),
            total_sessions=total_sessions,
            attended_sessions=attended_sessions,
            attendance_percentage=round(attendance_percentage, 2),
            average_rating=average_rating,
            performance_trend=performance_trend,
            monthly_stats=monthly_stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player performance")


# Get attendance summary for academy (Academy User)
@api_router.get("/academy/attendance/summary")
async def get_attendance_summary(start_date: str = None, end_date: str = None, user_info = Depends(require_academy_user)):
    """Get attendance summary for academy within date range"""
    try:
        academy_id = user_info["academy_id"]
        
        # Build date filter
        date_filter = {"academy_id": academy_id}
        if start_date and end_date:
            date_filter["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            date_filter["date"] = {"$gte": start_date}
        elif end_date:
            date_filter["date"] = {"$lte": end_date}
        
        # Get attendance records
        attendance_cursor = db.player_attendance.find(date_filter)
        attendance_records = await attendance_cursor.to_list(length=None)
        
        # Calculate summary statistics
        total_records = len(attendance_records)
        present_records = sum(1 for record in attendance_records if record["present"])
        overall_attendance_rate = (present_records / total_records * 100) if total_records > 0 else 0
        
        perf_filter = {"academy_id": academy_id}
        if start_date and end_date:
            perf_filter["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            perf_filter["date"] = {"$gte": start_date}
        elif end_date:
            perf_filter["date"] = {"$lte": end_date}

        perf_cursor = db.performance_metrics.find(perf_filter)
        perf_records = await perf_cursor.to_list(length=None)
        performance_ratings = [rec.get("overall_rating") for rec in perf_records if rec.get("overall_rating") is not None]
        average_performance = sum(performance_ratings) / len(performance_ratings) if performance_ratings else None
        
        return {
            "date_range": {"start": start_date, "end": end_date},
            "total_records": total_records,
            "present_records": present_records,
            "overall_attendance_rate": round(overall_attendance_rate, 2),
            "average_performance_rating": round(average_performance, 2) if average_performance else None,
            "total_performance_ratings": len(performance_ratings)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching attendance summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance summary")

# ========== COACH MANAGEMENT ENDPOINTS ==========

# Add detailed performance metrics (Academy User - Coaches)
@api_router.post("/academy/performance")
async def save_performance_metrics(performance: PerformanceMetricsCreate, user_info = Depends(require_academy_user)):
    """Save detailed performance metrics for a player on a specific date"""
    try:
        academy_id = user_info["academy_id"]
        
        # Verify player belongs to this academy
        player = await db.players.find_one({"id": performance.player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found or does not belong to your academy")
        
        # Check if attendance record exists and player was present
        attendance_record = await db.player_attendance.find_one({
            "player_id": performance.player_id,
            "academy_id": academy_id,
            "date": performance.date
        })
        
        if not attendance_record:
            raise HTTPException(status_code=400, detail="Attendance must be marked before adding performance metrics")
        
        if not attendance_record.get("present"):
            raise HTTPException(status_code=400, detail="Performance can only be added for players who were present")
        
        # Create or check performance_metrics collection document
        performance_id = str(uuid.uuid4())
        performance_doc = {
            "id": performance_id,
            "player_id": performance.player_id,
            "academy_id": academy_id,
            "date": performance.date,
            "speed": performance.speed,
            "agility": performance.agility,
            "movement": performance.movement,
            "pace": performance.pace,
            "stamina": performance.stamina,
            "overall_rating": performance.overall_rating,
            "notes": performance.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Check if performance already exists for this player and date
        existing = await db.performance_metrics.find_one({
            "player_id": performance.player_id,
            "academy_id": academy_id,
            "date": performance.date
        })
        
        if existing:
            # Update existing performance
            await db.performance_metrics.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "speed": performance.speed,
                    "agility": performance.agility,
                    "movement": performance.movement,
                    "pace": performance.pace,
                    "stamina": performance.stamina,
                    "overall_rating": performance.overall_rating,
                    "notes": performance.notes,
                    "updated_at": datetime.utcnow()
                }}
            )
            return {"message": "Performance metrics updated successfully", "performance_id": existing["id"]}
        else:
            # Insert new performance
            await db.performance_metrics.insert_one(performance_doc)
            return {"message": "Performance metrics saved successfully", "performance_id": performance_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving performance metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to save performance metrics")


# ============================================
# COACH-SPECIFIC ENDPOINTS
# ============================================

# Get coaches by sport (Public/Academy endpoint for dropdown)
@api_router.get("/coaches/by-sport")
async def get_coaches_by_sport(sport: str, user_info = Depends(require_academy_user)):
    """Get all coaches who handle a specific sport"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find coaches who have this sport in their sports array
        coaches_cursor = db.coaches.find({
            "academy_id": academy_id,
            "sports": sport,
            "status": "active"
        })
        
        coaches = await coaches_cursor.to_list(length=None)
        
        # Return simplified coach info for dropdown
        coach_list = [
            {
                "id": coach["id"],
                "name": f"{coach['first_name']} {coach['last_name']}",
                "specialization": coach.get("specialization")
            }
            for coach in coaches
        ]
        
        return coach_list
        
    except Exception as e:
        logger.error(f"Error fetching coaches by sport: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coaches")

# Get coach dashboard data
@api_router.get("/coach/dashboard")
async def get_coach_dashboard(user_info = Depends(require_coach_user)):
    """Get dashboard data for the authenticated coach"""
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]
        coach = user_info["coach"]
        
        # Get assigned players
        players_cursor = db.players.find({
            "coach_id": coach_id,
            "academy_id": academy_id,
            "status": "active"
        })
        players = await players_cursor.to_list(length=None)
        
        # Group players by sport
        players_by_sport = {}
        for player in players:
            sport = player.get("sport", "Other")
            if sport not in players_by_sport:
                players_by_sport[sport] = []
            players_by_sport[sport].append({
                "id": player["id"],
                "name": f"{player['first_name']} {player['last_name']}",
                "registration_number": player.get("registration_number"),
                "position": player.get("position")
            })
        
        # Calculate statistics
        total_players = len(players)
        stats_by_sport = {
            sport: len(player_list) 
            for sport, player_list in players_by_sport.items()
        }
        
        # Get recent attendance summary
        today = datetime.utcnow().date().isoformat()
        attendance_records = await db.player_attendance.count_documents({
            "academy_id": academy_id,
            "player_id": {"$in": [p["id"] for p in players]},
            "date": today,
            "present": True
        })
        
        return {
            "coach": {
                "id": coach["id"],
                "name": f"{coach['first_name']} {coach['last_name']}",
                "email": coach.get("email"),
                "sports": coach.get("sports", []),
                "specialization": coach.get("specialization"),
                "profile_picture_url": coach.get("profile_picture_url"),
                "description": coach.get("description")
            },
            "academy": (await db.academies.find_one({"id": academy_id}, {"_id": 0, "id": 1, "name": 1, "logo_url": 1})) or None,
            "summary": {
                "total_players": total_players,
                "stats_by_sport": stats_by_sport,
                "today_attendance": attendance_records
            },
            "players_by_sport": players_by_sport
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

# Get all players assigned to coach
@api_router.get("/coach/players", response_model=List[PlayerResponse])
async def get_coach_players(user_info = Depends(require_coach_user)):
    """Get all players assigned to the authenticated coach"""
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]
        
        # Get all players assigned to this coach
        players_cursor = db.players.find({
            "coach_id": coach_id,
            "academy_id": academy_id,
            "status": "active"
        })
        
        players = await players_cursor.to_list(length=None)
        
        # Convert to Player models
        player_list = [Player(**player) for player in players]
        
        return player_list
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach players: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch players")

# Update coach profile
@api_router.put("/coach/profile")
async def update_coach_profile(
    profile_picture_url: Optional[str] = None,
    description: Optional[str] = None,
    user_info = Depends(require_coach_user)
):
    """Update coach's profile picture and description"""
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]
        
        # Prepare update data
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        if profile_picture_url is not None:
            update_data["profile_picture_url"] = profile_picture_url
        
        if description is not None:
            update_data["description"] = description
        
        # Update coach
        await db.coaches.update_one(
            {"id": coach_id, "academy_id": academy_id},
            {"$set": update_data}
        )
        
        # Get updated coach
        updated_coach = await db.coaches.find_one({"id": coach_id})
        
        return Coach(**updated_coach)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating coach profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# Coach: Mark attendance for their players
@api_router.post("/coach/attendance")
async def coach_mark_attendance(attendance_data: AttendanceMarkingRequest, user_info = Depends(require_coach_user)):
    """Coach marks attendance for their assigned players"""
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]
        
        # Verify all players belong to this coach
        player_ids = [record.player_id for record in attendance_data.attendance_records]
        coach_players = await db.players.count_documents({
            "id": {"$in": player_ids},
            "coach_id": coach_id,
            "academy_id": academy_id
        })
        
        if coach_players != len(player_ids):
            raise HTTPException(
                status_code=403,
                detail="You can only mark attendance for players assigned to you"
            )
        
        # Process attendance records (same logic as academy endpoint)
        results = []
        for record in attendance_data.attendance_records:
            attendance_id = str(uuid.uuid4())
            attendance_doc = {
                "id": attendance_id,
                "player_id": record.player_id,
                "academy_id": academy_id,
                "date": attendance_data.date,
                "present": record.present,
                "sport": record.sport,
                "performance_ratings": record.performance_ratings or {},
                "notes": record.notes,
                "marked_by": coach_id,
                "marked_by_role": "coach",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Check if record exists
            existing = await db.player_attendance.find_one({
                "player_id": record.player_id,
                "academy_id": academy_id,
                "date": attendance_data.date
            })
            
            if existing:
                await db.player_attendance.update_one(
                    {"id": existing["id"]},
                    {"$set": {
                        "present": record.present,
                        "sport": record.sport,
                        "performance_ratings": record.performance_ratings or {},
                        "notes": record.notes,
                        "updated_at": datetime.utcnow()
                    }}
                )
                results.append({"player_id": record.player_id, "status": "updated"})
            else:
                await db.player_attendance.insert_one(attendance_doc)
                results.append({"player_id": record.player_id, "status": "created"})
        
        return {
            "message": "Attendance marked successfully",
            "date": attendance_data.date,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark attendance")

# Coach: Get attendance for a specific date (players assigned to coach)
@api_router.post("/coach/attendance/{date}")
async def coach_get_attendance_by_date(date: str, user_info = Depends(require_coach_user)):
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]

        attendance_cursor = db.player_attendance.find({
            "academy_id": academy_id,
            "date": date
        })
        attendance_records = await attendance_cursor.to_list(length=None)

        results = []
        for record in attendance_records:
            player = await db.players.find_one({"id": record["player_id"], "academy_id": academy_id})
            # Only include players assigned to this coach
            if not player or player.get("coach_id") != coach_id:
                continue
            results.append({
                "attendance_id": record["id"],
                "player_id": record["player_id"],
                "player_name": f"{player['first_name']} {player['last_name']}",
                "present": record.get("present", False),
                "performance_ratings": record.get("performance_ratings", {}),
                "notes": record.get("notes"),
                "marked_at": record.get("created_at")
            })

        return {"date": date, "attendance_records": results}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach attendance for {date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance")

# Coach: Add performance metrics for their players
@api_router.post("/coach/performance")
async def coach_add_performance(performance: PerformanceMetricsCreate, user_info = Depends(require_coach_user)):
    """Coach adds performance metrics for their assigned players"""
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]
        
        # Verify player belongs to this coach
        player = await db.players.find_one({
            "id": performance.player_id,
            "coach_id": coach_id,
            "academy_id": academy_id
        })
        
        if not player:
            raise HTTPException(
                status_code=403,
                detail="You can only add performance metrics for players assigned to you"
            )
        
        # Check if attendance record exists and player was present
        attendance_record = await db.player_attendance.find_one({
            "player_id": performance.player_id,
            "academy_id": academy_id,
            "date": performance.date
        })
        
        if not attendance_record:
            raise HTTPException(status_code=400, detail="Attendance must be marked before adding performance metrics")
        
        if not attendance_record.get("present"):
            raise HTTPException(status_code=400, detail="Performance can only be added for players who were present")
        
        # Create performance document
        performance_id = str(uuid.uuid4())
        performance_doc = {
            "id": performance_id,
            "player_id": performance.player_id,
            "academy_id": academy_id,
            "coach_id": coach_id,
            "date": performance.date,
            "speed": performance.speed,
            "agility": performance.agility,
            "movement": performance.movement,
            "pace": performance.pace,
            "stamina": performance.stamina,
            "overall_rating": performance.overall_rating,
            "notes": performance.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Check if performance already exists for this player and date
        existing = await db.performance_metrics.find_one({
            "player_id": performance.player_id,
            "academy_id": academy_id,
            "date": performance.date
        })
        
        if existing:
            # Update existing performance
            await db.performance_metrics.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "speed": performance.speed,
                    "agility": performance.agility,
                    "movement": performance.movement,
                    "pace": performance.pace,
                    "stamina": performance.stamina,
                    "overall_rating": performance.overall_rating,
                    "notes": performance.notes,
                    "updated_at": datetime.utcnow()
                }}
            )
            return {"message": "Performance metrics updated successfully", "performance_id": existing["id"]}
        else:
            # Insert new performance
            await db.performance_metrics.insert_one(performance_doc)
            return {"message": "Performance metrics saved successfully", "performance_id": performance_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving performance metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to save performance metrics")

@api_router.get("/coach/players/{player_id}/performance", response_model=PlayerPerformanceAnalytics)
async def coach_get_player_performance(player_id: str, user_info = Depends(require_coach_user)):
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]

        player = await db.players.find_one({"id": player_id, "academy_id": academy_id, "coach_id": coach_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found or not assigned to coach")

        all_sessions_cursor = db.player_attendance.find({"player_id": player_id, "academy_id": academy_id})
        all_sessions = await all_sessions_cursor.to_list(length=None)

        total_sessions = len(all_sessions)
        attended_sessions_records = [s for s in all_sessions if s.get("present")]
        attended_sessions = len(attended_sessions_records)
        attendance_percentage = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0

        perf_cursor = db.performance_metrics.find({"player_id": player_id, "academy_id": academy_id})
        perf_records = await perf_cursor.to_list(length=None)

        all_ratings = [rec.get("overall_rating") for rec in perf_records if rec.get("overall_rating") is not None]
        average_rating = round(sum(all_ratings) / len(all_ratings), 2) if all_ratings else None

        performance_trend = sorted([
            {
                "date": rec["date"],
                "rating": rec.get("overall_rating"),
                "speed": rec.get("speed"),
                "agility": rec.get("agility"),
                "movement": rec.get("movement"),
                "pace": rec.get("pace"),
                "stamina": rec.get("stamina"),
                "notes": rec.get("notes", "")
            }
            for rec in perf_records
            if rec.get("overall_rating") is not None
        ], key=lambda x: x["date"])

        monthly_stats = {}
        perf_map = {rec["date"]: rec.get("overall_rating") for rec in perf_records if rec.get("overall_rating") is not None}
        for record in all_sessions:
            month_key = record["date"][:7]
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {"total_sessions": 0, "attended_sessions": 0, "ratings": []}
            monthly_stats[month_key]["total_sessions"] += 1
            if record.get("present"):
                monthly_stats[month_key]["attended_sessions"] += 1
                r = perf_map.get(record["date"]) 
                if r is not None:
                    monthly_stats[month_key]["ratings"].append(r)
        for month, stats in monthly_stats.items():
            stats["attendance_percentage"] = (stats["attended_sessions"] / stats["total_sessions"] * 100) if stats["total_sessions"] > 0 else 0
            stats["average_rating"] = round(sum(stats["ratings"]) / len(stats["ratings"]), 2) if stats["ratings"] else None
            del stats["ratings"]

        return PlayerPerformanceAnalytics(
            player_id=player_id,
            player_name=f"{player['first_name']} {player['last_name']}",
            sport=player.get("sport", "Other"),
            total_sessions=total_sessions,
            attended_sessions=attended_sessions,
            attendance_percentage=round(attendance_percentage, 2),
            average_rating=average_rating,
            performance_trend=performance_trend,
            monthly_stats=monthly_stats
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach player performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player performance")

@api_router.get("/coach/attendance/summary")
async def coach_get_attendance_summary(start_date: str = None, end_date: str = None, user_info = Depends(require_coach_user)):
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]

        players_cursor = db.players.find({"coach_id": coach_id, "academy_id": academy_id, "status": "active"})
        players = await players_cursor.to_list(length=None)
        player_ids = [p["id"] for p in players]

        date_filter = {"academy_id": academy_id, "player_id": {"$in": player_ids}}
        if start_date and end_date:
            date_filter["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            date_filter["date"] = {"$gte": start_date}
        elif end_date:
            date_filter["date"] = {"$lte": end_date}

        attendance_cursor = db.player_attendance.find(date_filter)
        attendance_records = await attendance_cursor.to_list(length=None)

        total_records = len(attendance_records)
        present_records = sum(1 for record in attendance_records if record.get("present"))
        overall_attendance_rate = (present_records / total_records * 100) if total_records > 0 else 0

        perf_filter = {"academy_id": academy_id, "player_id": {"$in": player_ids}}
        if start_date and end_date:
            perf_filter["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            perf_filter["date"] = {"$gte": start_date}
        elif end_date:
            perf_filter["date"] = {"$lte": end_date}

        perf_cursor = db.performance_metrics.find(perf_filter)
        perf_records = await perf_cursor.to_list(length=None)
        performance_ratings = [rec.get("overall_rating") for rec in perf_records if rec.get("overall_rating") is not None]
        average_performance = sum(performance_ratings) / len(performance_ratings) if performance_ratings else None

        return {
            "date_range": {"start": start_date, "end": end_date},
            "total_records": total_records,
            "present_records": present_records,
            "overall_attendance_rate": round(overall_attendance_rate, 2),
            "average_performance_rating": round(average_performance, 2) if average_performance else None,
            "total_performance_ratings": len(performance_ratings)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach attendance summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance summary")

# Get coach notifications
@api_router.get("/coach/notifications")
async def get_coach_notifications(user_info = Depends(require_coach_user)):
    """Get all notifications for the authenticated coach"""
    try:
        coach_id = user_info["coach_id"]
        
        # Get notifications sorted by newest first
        notifications_cursor = db.notifications.find({
            "coach_id": coach_id
        }).sort("created_at", -1)
        
        notifications = await notifications_cursor.to_list(length=100)
        
        # Convert to Notification models
        notification_list = [Notification(**notif) for notif in notifications]
        
        # Count unread
        unread_count = sum(1 for n in notifications if not n.get("is_read", False))
        
        return {
            "notifications": notification_list,
            "unread_count": unread_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

# Mark notification as read
@api_router.put("/coach/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_info = Depends(require_coach_user)):
    """Mark a notification as read"""
    try:
        coach_id = user_info["coach_id"]
        
        # Verify notification belongs to this coach
        notification = await db.notifications.find_one({
            "id": notification_id,
            "coach_id": coach_id
        })
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Mark as read
        await db.notifications.update_one(
            {"id": notification_id},
            {"$set": {"is_read": True}}
        )
        
        return {"message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification")

# Mark all notifications as read
@api_router.put("/coach/notifications/read-all")
async def mark_all_notifications_read(user_info = Depends(require_coach_user)):
    """Mark all notifications as read for the authenticated coach"""
    try:
        coach_id = user_info["coach_id"]
        
        # Mark all as read
        result = await db.notifications.update_many(
            {"coach_id": coach_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        
        return {
            "message": "All notifications marked as read",
            "updated_count": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notifications")

# Change password endpoint (for coaches)
@api_router.post("/auth/change-password")
async def change_password(
    request: CoachPasswordChangeRequest,
    user_info = Depends(require_coach_user)
):
    """Change password for the authenticated coach"""
    try:
        coach_id = user_info["coach_id"]
        supabase_user_id = user_info["coach"].get("supabase_user_id")
        
        if not supabase_user_id:
            raise HTTPException(
                status_code=400,
                detail="No authentication account linked to this coach"
            )
        
        # Validate password
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters long"
            )
        
        # Update password in Supabase using admin client
        try:
            supabase_admin.auth.admin.update_user_by_id(
                supabase_user_id,
                {"password": request.new_password}
            )
            logger.info(f"Successfully updated password in Supabase for coach {coach_id}")
        except Exception as e:
            logger.error(f"Failed to update password in Supabase: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to update password in authentication system"
            )
        
        # Update password_changed flag in database
        await db.coaches.update_one(
            {"id": coach_id},
            {"$set": {
                "password_changed": True,
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"Password changed successfully for coach {coach_id}")
        
        return {
            "message": "Password changed successfully. Please use your new password to log in.",
            "has_reset_password": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")


# Get all coaches for an academy (Academy User)
@api_router.get("/academy/coaches", response_model=List[CoachResponse])
async def get_academy_coaches(user_info = Depends(require_academy_user)):
    """Get all coaches for the authenticated academy (sensitive fields excluded)"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get coaches for this academy
        coaches_cursor = db.coaches.find({"academy_id": academy_id})
        coaches = await coaches_cursor.to_list(length=None)
        
        # Add has_reset_password field to response
        coaches_with_status = []
        for coach in coaches:
            coach_data = dict(coach)
            # Remove MongoDB _id field to avoid serialization issues
            coach_data.pop("_id", None)
            # Use password_changed as has_reset_password
            coach_data["has_reset_password"] = coach.get("password_changed", False)
            # Include temporary password if not reset
            if not coach.get("password_changed", False):
                coach_data["temporary_password"] = coach.get("default_password")
            coaches_with_status.append(coach_data)
        
        return coaches_with_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy coaches: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coaches")

# Create a new coach (Academy User)
@api_router.post("/academy/coaches")
async def create_coach(coach_data: CoachCreate, user_info = Depends(require_academy_user)):
    """Create a new coach for the authenticated academy with auto-generated login"""
    try:
        academy_id = user_info["academy_id"]
        academy = user_info["academy"]
        
        # Check if academy has reached coach limit
        current_coaches = await db.coaches.count_documents({"academy_id": academy_id, "status": "active"})
        if current_coaches >= academy.get("coach_limit", 10):
            raise HTTPException(
                status_code=400,
                detail=f"Academy has reached maximum coach limit of {academy.get('coach_limit', 10)}"
            )
        
        # Validate email is provided for creating login
        if not coach_data.email:
            raise HTTPException(status_code=400, detail="Email is required to create coach login")
        
        # Check if email already exists in Supabase
        try:
            # Try to get user by email from Supabase
            existing_user = supabase_admin.auth.admin.list_users()
            for user in existing_user:
                if user.email == coach_data.email:
                    raise HTTPException(
                        status_code=409, 
                        detail="A user with this email already exists"
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Could not verify email uniqueness in Supabase: {e}")
        
        # Check if email already exists in local database
        existing_coach = await db.coaches.find_one({"email": coach_data.email, "academy_id": academy_id})
        if existing_coach:
            raise HTTPException(
                status_code=409, 
                detail="A coach with this email already exists in this academy"
            )
        
        # Generate secure temporary password
        default_password = generate_default_password()
        supabase_user_id = None
        
        if coach_data.email:
            coach_dict = coach_data.dict()
            coach_dict["academy_id"] = academy_id
            supabase_user_id = await create_coach_supabase_account(
                coach_data.email, 
                default_password, 
                coach_dict
            )
            
            if not supabase_user_id:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create coach authentication account"
                )
        
        # Create new coach with has_reset_password flag
        coach = Coach(
            academy_id=academy_id,
            **coach_data.dict(),
            has_login=bool(supabase_user_id),
            default_password=default_password,
            password_changed=False,  # This will be our has_reset_password flag
            supabase_user_id=supabase_user_id
        )
        
        # Save to database
        await db.coaches.insert_one(coach.dict())
        
        # Return coach with temporary password (only shown once)
        response_data = coach.dict()
        response_data["temporary_password"] = default_password if supabase_user_id else None
        response_data["has_reset_password"] = False
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to create coach")

# Get specific coach (Academy User)
@api_router.get("/academy/coaches/{coach_id}", response_model=CoachResponse)
async def get_coach(coach_id: str, user_info = Depends(require_academy_user)):
    """Get specific coach for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find coach
        coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        
        # Remove MongoDB _id field
        coach.pop("_id", None)
        return Coach(**coach)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coach")

# Update coach (Academy User)
@api_router.put("/academy/coaches/{coach_id}", response_model=CoachResponse)
async def update_coach(coach_id: str, coach_data: CoachUpdate, user_info = Depends(require_academy_user)):
    """Update specific coach for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if coach exists
        existing_coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not existing_coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        
        # Update coach data
        update_data = {k: v for k, v in coach_data.dict().items() if v is not None}

        # SECURITY FIX MEDIUM #1: Explicitly exclude sensitive authentication fields
        # These fields should never be modified via API updates
        sensitive_fields = {'has_login', 'default_password', 'password_changed', 'supabase_user_id', 'id', 'academy_id', 'created_at'}
        for field in sensitive_fields:
            update_data.pop(field, None)

        update_data["updated_at"] = datetime.utcnow()
        
        await db.coaches.update_one(
            {"id": coach_id, "academy_id": academy_id},
            {"$set": update_data}
        )
        
        # Get updated coach
        updated_coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        # Remove MongoDB _id field
        updated_coach.pop("_id", None)
        return Coach(**updated_coach)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to update coach")

# Delete coach (Academy User)
@api_router.delete("/academy/coaches/{coach_id}")
async def delete_coach(coach_id: str, user_info = Depends(require_academy_user)):
    """Delete specific coach for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if coach exists
        existing_coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not existing_coach:
            raise HTTPException(status_code=404, detail="Coach not found")
        
        # Delete coach
        await db.coaches.delete_one({"id": coach_id, "academy_id": academy_id})
        
        return {"message": "Coach deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete coach")

# ========== ACADEMY STATS ENDPOINT ==========

# Get academy stats (Academy User)
@api_router.get("/academy/stats")
async def get_academy_stats(user_info = Depends(require_academy_user)):
    """Get academy statistics"""
    try:
        academy_id = user_info["academy_id"]
        
        # Count players and coaches
        total_players = await db.players.count_documents({"academy_id": academy_id})
        active_players = await db.players.count_documents({"academy_id": academy_id, "status": "active"})
        total_coaches = await db.coaches.count_documents({"academy_id": academy_id})
        active_coaches = await db.coaches.count_documents({"academy_id": academy_id, "status": "active"})
        
        return {
            "total_players": total_players,
            "active_players": active_players,
            "total_coaches": total_coaches,
            "active_coaches": active_coaches,
            "player_limit": user_info["academy"].get("player_limit", 50),
            "coach_limit": user_info["academy"].get("coach_limit", 10)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academy stats")

# ========== ACADEMY SETTINGS MODELS ==========

class AcademySettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    academy_id: str
    
    # Branding Settings (Academy can edit)
    logo_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None  # {"facebook": "url", "twitter": "url", etc.}
    theme_color: Optional[str] = "#0ea5e9"  # Default sky-500
    
    # Operational Settings (Academy can edit)
    season_start_date: Optional[str] = None
    season_end_date: Optional[str] = None
    training_days: Optional[List[str]] = None  # ["Monday", "Wednesday", "Friday"]
    training_time: Optional[str] = None  # "6:00 PM - 8:00 PM"
    facility_address: Optional[str] = None
    facility_amenities: Optional[List[str]] = None  # ["Gym", "Pool", "Field"]
    
    # Notification Settings (Academy can edit)
    email_notifications: Optional[bool] = True
    sms_notifications: Optional[bool] = False
    parent_notifications: Optional[bool] = True
    coach_notifications: Optional[bool] = True
    
    # Privacy Settings (Academy can edit)
    public_profile: Optional[bool] = False
    show_player_stats: Optional[bool] = True
    show_coach_info: Optional[bool] = True
    data_sharing_consent: Optional[bool] = False
    
    # System Settings (Read-only for academy, set by admin)
    max_file_upload_size: Optional[int] = 5  # MB
    allowed_file_types: Optional[List[str]] = ["jpg", "jpeg", "png", "pdf"]
    auto_backup: Optional[bool] = True
    maintenance_mode: Optional[bool] = False
    api_access: Optional[bool] = True
    fee_reminder_type: Optional[str] = "manual"  # "manual" or "automatic"

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AcademySettingsCreate(BaseModel):
    # Branding Settings
    description: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    theme_color: Optional[str] = "#0ea5e9"
    
    # Operational Settings
    season_start_date: Optional[str] = None
    season_end_date: Optional[str] = None
    training_days: Optional[List[str]] = None
    training_time: Optional[str] = None
    facility_address: Optional[str] = None
    facility_amenities: Optional[List[str]] = None
    
    # Notification Settings
    email_notifications: Optional[bool] = True
    sms_notifications: Optional[bool] = False
    parent_notifications: Optional[bool] = True
    coach_notifications: Optional[bool] = True
    
    # Privacy Settings
    public_profile: Optional[bool] = False
    show_player_stats: Optional[bool] = True
    show_coach_info: Optional[bool] = True
    data_sharing_consent: Optional[bool] = False

class AcademySettingsUpdate(BaseModel):
    # Branding Settings
    logo_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    
    # Operational Settings
    season_start_date: Optional[str] = None
    season_end_date: Optional[str] = None
    training_days: Optional[List[str]] = None
    training_time: Optional[str] = None
    facility_address: Optional[str] = None
    facility_amenities: Optional[List[str]] = None
    
    # Notification Settings
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    parent_notifications: Optional[bool] = None
    coach_notifications: Optional[bool] = None
    
    # Privacy Settings
    public_profile: Optional[bool] = None
    show_player_stats: Optional[bool] = None
    show_coach_info: Optional[bool] = None
    data_sharing_consent: Optional[bool] = None

    # System Settings
    auto_backup: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    api_access: Optional[bool] = None
    fee_reminder_type: Optional[str] = None  # "manual" or "automatic"

# ========== ACADEMY SETTINGS ENDPOINTS ==========

# Get academy settings (Academy User)
@api_router.get("/academy/settings", response_model=AcademySettings)
async def get_academy_settings(user_info = Depends(require_academy_user)):
    """Get academy settings for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if settings exist
        settings = await db.academy_settings.find_one({"academy_id": academy_id})
        
        if not settings:
            # Create default settings if none exist
            default_settings = AcademySettings(academy_id=academy_id)
            settings_dict = default_settings.dict()
            await db.academy_settings.insert_one(settings_dict)
            return default_settings
        
        return AcademySettings(**settings)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academy settings")

# Update academy settings (Academy User)
@api_router.put("/academy/settings", response_model=AcademySettings)
async def update_academy_settings(
    settings_data: AcademySettingsUpdate, 
    user_info = Depends(require_academy_user)
):
    """Update academy settings for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Prepare update data
        update_data = {k: v for k, v in settings_data.dict().items() if v is not None}
        update_data.pop("theme_color", None)
        update_data["updated_at"] = datetime.utcnow()
        
        # Update settings using upsert
        result = await db.academy_settings.update_one(
            {"academy_id": academy_id},
            {"$set": update_data},
            upsert=True
        )

        # SYNC: If logo_url or branding.logo_url is being updated, sync it to the main academies collection
        if "logo_url" in update_data or "branding" in update_data:
            logo_url = None
            if "branding" in update_data and update_data["branding"].get("logo_url"):
                logo_url = update_data["branding"]["logo_url"]
            elif "logo_url" in update_data:
                logo_url = update_data["logo_url"]

            if logo_url:
                await db.academies.update_one(
                    {"id": academy_id},
                    {"$set": {"logo_url": logo_url, "updated_at": datetime.utcnow()}}
                )

        # Get updated settings
        updated_settings = await db.academy_settings.find_one({"academy_id": academy_id})
        return AcademySettings(**updated_settings)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating academy settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update academy settings")

# Upload academy logo (Academy User)
@api_router.post("/academy/logo")
async def upload_academy_logo(
    file: UploadFile = File(...),
    user_info = Depends(require_academy_user)
):
    """Upload academy logo"""
    try:
        academy_id = user_info["academy_id"]

        # Read file content for validation
        content = await file.read()

        # SECURITY FIX #2: Validate actual file content using magic numbers
        if not await validate_image_file(content, file.filename):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # SECURITY FIX #4: Use pathlib for safe file extension extraction
        file_extension = Path(file.filename).suffix.lower().lstrip('.')

        # Whitelist allowed extensions
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Generate unique filename
        filename = f"{academy_id}_{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / filename

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Generate URL
        logo_url = f"/api/uploads/logos/{filename}"
        
        # Update academy settings with new logo URL
        await db.academy_settings.update_one(
            {"academy_id": academy_id},
            {
                "$set": {
                    "logo_url": logo_url,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {"logo_url": logo_url, "message": "Logo uploaded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading academy logo: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")

# ========== ACADEMY ANALYTICS MODELS ==========

class PlayerAnalytics(BaseModel):
    total_players: int
    active_players: int
    inactive_players: int
    age_distribution: Dict[str, int]  # {"under_18": 15, "18_25": 20, "over_25": 5}
    position_distribution: Dict[str, int]  # {"forward": 10, "midfielder": 8, etc.}
    status_distribution: Dict[str, int]  # {"active": 35, "inactive": 5}
    recent_additions: int  # players added in last 30 days

class CoachAnalytics(BaseModel):
    total_coaches: int
    active_coaches: int
    inactive_coaches: int
    specialization_distribution: Dict[str, int]  # {"fitness": 2, "technical": 3}
    experience_distribution: Dict[str, int]  # {"0_2_years": 1, "3_5_years": 2}
    average_experience: float
    recent_additions: int  # coaches added in last 30 days

class GrowthMetrics(BaseModel):
    monthly_player_growth: List[Dict[str, Any]]  # [{"month": "Jan", "count": 5}]
    monthly_coach_growth: List[Dict[str, Any]]
    yearly_summary: Dict[str, int]  # {"players_added": 25, "coaches_added": 3}

class OperationalMetrics(BaseModel):
    capacity_utilization: Dict[str, float]  # {"players": 70.0, "coaches": 80.0}
    academy_age: int  # days since academy creation
    settings_completion: float  # percentage of settings filled out
    recent_activity: Dict[str, int]  # {"players_updated": 5, "coaches_updated": 2}

class AcademyAnalytics(BaseModel):
    academy_id: str
    academy_name: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Core Analytics
    player_analytics: PlayerAnalytics
    coach_analytics: CoachAnalytics
    growth_metrics: GrowthMetrics
    operational_metrics: OperationalMetrics
    
    # Quick Stats
    total_members: int  # players + coaches
    monthly_growth_rate: float
    capacity_usage: float

# ========== ACADEMY ANALYTICS ENDPOINTS ==========

# Get comprehensive academy analytics (Academy User)
@api_router.get("/academy/analytics", response_model=AcademyAnalytics)
async def get_academy_analytics(user_info = Depends(require_academy_user)):
    """Get comprehensive analytics for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        academy_name = user_info["academy"]["name"]
        
        # Get players and coaches
        players = await db.players.find({"academy_id": academy_id}).to_list(1000)
        coaches = await db.coaches.find({"academy_id": academy_id}).to_list(100)
        academy_data = await db.academies.find_one({"id": academy_id})
        
        # Calculate player analytics
        total_players = len(players)
        active_players = len([p for p in players if p.get("status") == "active"])
        inactive_players = total_players - active_players
        
        # Age distribution
        age_distribution = {"under_18": 0, "18_25": 0, "over_25": 0}
        position_distribution = {}
        status_distribution = {"active": 0, "inactive": 0}
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_player_additions = 0
        
        for player in players:
            # Age distribution
            age = player.get("age")
            if age is None:
                age = 0
            if age < 18:
                age_distribution["under_18"] += 1
            elif age <= 25:
                age_distribution["18_25"] += 1
            else:
                age_distribution["over_25"] += 1
            
            position = player.get("position")  # Get position, which can be None
            if position is None:
                position = "Unknown"  # Explicitly set to a string
            position_distribution[position] = position_distribution.get(position, 0) + 1
            
            # Status distribution
            status = player.get("status")
            if status is None:
                status = "inactive" # <--- FIXED: Assign a default string if the value is None
            status_distribution[status] = status_distribution.get(status, 0) + 1
            
            # Recent additions
            created_at = player.get("created_at")
            if created_at and isinstance(created_at, datetime) and created_at >= thirty_days_ago:
                recent_player_additions += 1
        
        player_analytics = PlayerAnalytics(
            total_players=total_players,
            active_players=active_players,
            inactive_players=inactive_players,
            age_distribution=age_distribution,
            position_distribution=position_distribution,
            status_distribution=status_distribution,
            recent_additions=recent_player_additions
        )
        
        # Calculate coach analytics
        total_coaches = len(coaches)
        active_coaches = len([c for c in coaches if c.get("status") == "active"])
        inactive_coaches = total_coaches - active_coaches
        
        specialization_distribution = {}
        experience_distribution = {"0_2_years": 0, "3_5_years": 0, "6_10_years": 0, "over_10_years": 0}
        total_experience = 0
        recent_coach_additions = 0
        
        for coach in coaches:
            # Specialization distribution
            specialization = coach.get("specialization")
            if specialization is None:                    # Check if it is None
                specialization = "General"
            specialization_distribution[specialization] = specialization_distribution.get(specialization, 0) + 1
            
            # Experience distribution
            experience_years = coach.get("experience_years")  # Get the value
            if experience_years is None:                      # Check if it is None
                experience_years = 0 
            total_experience += experience_years
            
            if experience_years <= 2:
                experience_distribution["0_2_years"] += 1
            elif experience_years <= 5:
                experience_distribution["3_5_years"] += 1
            elif experience_years <= 10:
                experience_distribution["6_10_years"] += 1
            else:
                experience_distribution["over_10_years"] += 1
            
            # Recent additions
            created_at = coach.get("created_at")
            if created_at and isinstance(created_at, datetime) and created_at >= thirty_days_ago:
                recent_coach_additions += 1
        
        average_experience = total_experience / total_coaches if total_coaches > 0 else 0
        
        coach_analytics = CoachAnalytics(
            total_coaches=total_coaches,
            active_coaches=active_coaches,
            inactive_coaches=inactive_coaches,
            specialization_distribution=specialization_distribution,
            experience_distribution=experience_distribution,
            average_experience=round(average_experience, 1),
            recent_additions=recent_coach_additions
        )
        
        # Calculate growth metrics (simplified for now)
        monthly_player_growth = [{"month": "Current", "count": recent_player_additions}]
        monthly_coach_growth = [{"month": "Current", "count": recent_coach_additions}]
        yearly_summary = {"players_added": total_players, "coaches_added": total_coaches}
        
        growth_metrics = GrowthMetrics(
            monthly_player_growth=monthly_player_growth,
            monthly_coach_growth=monthly_coach_growth,
            yearly_summary=yearly_summary
        )
        
        # Calculate operational metrics
        player_limit = academy_data.get("player_limit", 50)
        coach_limit = academy_data.get("coach_limit", 10)
        
        player_capacity = (total_players / player_limit * 100) if player_limit > 0 else 0
        coach_capacity = (total_coaches / coach_limit * 100) if coach_limit > 0 else 0
        
        academy_created = academy_data.get("created_at", datetime.utcnow())
        academy_age = (datetime.utcnow() - academy_created).days if isinstance(academy_created, datetime) else 0
        
        # Check settings completion (simplified)
        settings = await db.academy_settings.find_one({"academy_id": academy_id})
        settings_filled = 0
        total_settings = 10  # approximate number of key settings
        
        if settings:
            key_fields = ["description", "website", "facility_address", "training_days", "training_time"]
            settings_filled = sum(1 for field in key_fields if settings.get(field))
        
        settings_completion = (settings_filled / total_settings * 100)
        
        operational_metrics = OperationalMetrics(
            capacity_utilization={"players": round(player_capacity, 1), "coaches": round(coach_capacity, 1)},
            academy_age=academy_age,
            settings_completion=round(settings_completion, 1),
            recent_activity={"players_updated": recent_player_additions, "coaches_updated": recent_coach_additions}
        )
        
        # Calculate summary metrics
        total_members = total_players + total_coaches
        monthly_growth_rate = 0  # Initialize with a default value
        if total_members > 0:
            monthly_growth_rate = ((recent_player_additions + recent_coach_additions) / total_members) * 100
        capacity_usage = (player_capacity + coach_capacity) / 2
        
        return AcademyAnalytics(
            academy_id=academy_id,
            academy_name=academy_name,
            player_analytics=player_analytics,
            coach_analytics=coach_analytics,
            growth_metrics=growth_metrics,
            operational_metrics=operational_metrics,
            total_members=total_members,
            monthly_growth_rate=round(monthly_growth_rate, 1),
            capacity_usage=round(capacity_usage, 1)
)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching academy analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch academy analytics")

# Get player-specific analytics (Academy User)
@api_router.get("/academy/analytics/players", response_model=PlayerAnalytics)
async def get_player_analytics(user_info = Depends(require_academy_user)):
    """Get detailed player analytics for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get comprehensive analytics and return just player analytics
        analytics = await get_academy_analytics(user_info)
        return analytics.player_analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player analytics")

# Get coach-specific analytics (Academy User)
@api_router.get("/academy/analytics/coaches", response_model=CoachAnalytics)
async def get_coach_analytics(user_info = Depends(require_academy_user)):
    """Get detailed coach analytics for the authenticated academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get comprehensive analytics and return just coach analytics
        analytics = await get_academy_analytics(user_info)
        return analytics.coach_analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coach analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coach analytics")

# ========== PLAYER AUTHENTICATION ENDPOINTS ==========

# Player Login
@api_router.post("/player/auth/login", response_model=PlayerAuthResponse)
async def player_login(request: PlayerSignInRequest):
    """Player login endpoint"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if response.user:
            # Verify this is a player account
            player = await db.players.find_one({"supabase_user_id": response.user.id})
            if not player:
                raise HTTPException(status_code=403, detail="Account is not associated with a player profile")
            
            return PlayerAuthResponse(
                player=response.user.model_dump() if hasattr(response.user, 'model_dump') else dict(response.user),
                session=response.session.model_dump() if hasattr(response.session, 'model_dump') else dict(response.session),
                message="Player login successful"
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Player login error: {e}")
        raise HTTPException(status_code=400, detail="Login failed")

# Get Player Profile
@api_router.get("/player/profile")
async def get_player_profile(user_info = Depends(require_player_user)):
    """Get player profile information"""
    try:
        player = user_info["player"]
        
        # Get academy information
        academy = await db.academies.find_one({"id": player["academy_id"]})
        
        # Get coach information
        coach_name = None
        if player.get("coach_id"):
            coach = await db.coaches.find_one({"id": player["coach_id"]})
            if coach:
                coach_name = f"{coach.get('first_name', '')} {coach.get('last_name', '')}".strip()
        
        # Create clean player data without MongoDB ObjectId
        player_data = {
            "id": player.get("id"),
            "first_name": player.get("first_name"),
            "last_name": player.get("last_name"),
            "email": player.get("email"),
            "phone": player.get("phone"),
            "date_of_birth": player.get("date_of_birth"),
            "age": player.get("age"),
            "gender": player.get("gender"),
            "sport": player.get("sport"),
            "position": player.get("position"),
            "registration_number": player.get("registration_number"),
            "height": player.get("height"),
            "weight": player.get("weight"),
            "photo_url": player.get("photo_url"),
            "training_days": player.get("training_days", []),
            "training_batch": player.get("training_batch"),
            "emergency_contact_name": player.get("emergency_contact_name"),
            "emergency_contact_phone": player.get("emergency_contact_phone"),
            "medical_notes": player.get("medical_notes"),
            "status": player.get("status"),
            "academy_id": player.get("academy_id"),
            "coach_name": coach_name,
            "created_at": player.get("created_at").isoformat() if player.get("created_at") else None,
            "updated_at": player.get("updated_at").isoformat() if player.get("updated_at") else None
        }
        
        # Create clean academy data
        academy_data = None
        if academy:
            academy_data = {
                "id": academy.get("id"),
                "name": academy.get("name"),
                "logo_url": academy.get("logo_url"),
                "location": academy.get("location"),
                "sports_type": academy.get("sports_type")
            }
        
        return {
            "player": player_data,
            "academy": academy_data
        }
    except Exception as e:
        logger.error(f"Error fetching player profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player profile")

# Update Player Password
@api_router.put("/player/change-password")
async def change_player_password(request: PlayerPasswordChangeRequest, user_info = Depends(require_player_user)):
    """Change player password"""
    try:
        # Verify current password by attempting to sign in
        try:
            supabase.auth.sign_in_with_password({
                "email": user_info["user"].email,
                "password": request.current_password
            })
        except Exception as e:
            # SECURITY FIX: Catch specific exception instead of bare except
            logger.error(f"Password verification error: {e}")
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password in Supabase
        supabase.auth.update_user({
            "password": request.new_password
        })
        
        # Mark password as changed in database
        await db.players.update_one(
            {"id": user_info["player_id"]},
            {"$set": {"password_changed": True, "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing player password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

# ========== PLAYER DASHBOARD ENDPOINTS ==========

# Get Player Attendance History
@api_router.get("/player/attendance")
async def get_player_attendance_history(user_info = Depends(require_player_user)):
    """Get player's attendance history"""
    try:
        player_id = user_info["player_id"]
        academy_id = user_info["academy_id"]

        # SECURITY FIX MEDIUM #2: Add academy_id filter for proper data isolation
        # Get attendance records for this player
        attendance_records_raw = await db.player_attendance.find(
            {"player_id": player_id, "academy_id": academy_id}
        ).sort("date", -1).limit(100).to_list(100)
        
        # Clean attendance records for JSON serialization
        attendance_records = []
        for record in attendance_records_raw:
            clean_record = {
                "id": record.get("id"),
                "player_id": record.get("player_id"),
                "academy_id": record.get("academy_id"),
                "date": record.get("date"),
                "present": record.get("present"),
                "sport": record.get("sport"),
                "performance_ratings": record.get("performance_ratings", {}),
                "notes": record.get("notes"),
                "marked_by": record.get("marked_by"),
                "created_at": record.get("created_at").isoformat() if record.get("created_at") else None
            }
            attendance_records.append(clean_record)
        
        # Calculate attendance statistics
        total_sessions = len(attendance_records)
        attended_sessions = len([r for r in attendance_records if r.get("present", False)])
        attendance_percentage = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        return {
            "attendance_records": attendance_records,
            "statistics": {
                "total_sessions": total_sessions,
                "attended_sessions": attended_sessions,
                "missed_sessions": total_sessions - attended_sessions,
                "attendance_percentage": round(attendance_percentage, 2)
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching player attendance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance history")

# Get Player Performance Stats
@api_router.get("/player/performance")
async def get_player_performance_stats(user_info = Depends(require_player_user)):
    """Get player's performance statistics"""
    try:
        player_id = user_info["player_id"]
        player = user_info["player"]
        
        # Get performance data from attendance records
        attendance_records = await db.player_attendance.find(
            {"player_id": player_id, "present": True}
        ).sort("date", -1).to_list(100)
        
        # Calculate performance averages
        category_averages = {}
        performance_trend = []

        if attendance_records:
        # Get performance categories for this player's sport
            sport_categories = get_sport_performance_categories(player.get("sport", "Other"))

            # Calculate averages for each category
            for category in sport_categories:
                ratings = []
                for record in attendance_records:
                    # FIXED: Check if performance_ratings is not None before calling .get()
                    ratings_dict = record.get("performance_ratings")
                    if ratings_dict:
                        rating = ratings_dict.get(category)
                        if rating is not None:
                            ratings.append(rating)

                if ratings:
                    category_averages[category] = round(sum(ratings) / len(ratings), 2)
                else:
                    category_averages[category] = 0

            # Build performance trend (last 30 days)
            recent_records = attendance_records[:30]
            for record in recent_records:
                # FIXED: Handle None for performance_ratings
                ratings_dict = record.get("performance_ratings")
                if ratings_dict:
                    overall_rating = sum(ratings_dict.values()) / len(ratings_dict) if ratings_dict else 0
                else:
                    overall_rating = 0

                performance_trend.append({
                    "date": record.get("date"),
                    "overall_rating": overall_rating,
                    "ratings": ratings_dict or {}  # Ensure an empty dict is used as a default
                })
    
        overall_average = sum(category_averages.values()) / len(category_averages) if category_averages else 0
        
        return {
            "player_id": player_id,
            "player_name": f"{player.get('first_name', '')} {player.get('last_name', '')}",
            "sport": player.get("sport"),
            "position": player.get("position"),
            "total_sessions": len(attendance_records),
            "category_averages": category_averages,
            "overall_average_rating": round(overall_average, 2),
            "performance_trend": performance_trend[:10]  # Last 10 sessions
        }
        
    except Exception as e:
        logger.error(f"Error fetching player performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch performance statistics")

# Get Player Announcements
@api_router.get("/player/announcements")
async def get_player_announcements(user_info = Depends(require_player_user)):
    """Get announcements for the player"""
    try:
        player_id = user_info["player_id"]
        academy_id = user_info["academy_id"]
        
        # Get announcements targeted to this player or all players
        announcements_raw = await db.announcements.find({
            "academy_id": academy_id,
            "is_active": True,
            "$or": [
                {"target_audience": "all"},
                {"target_audience": "players"},
                {"target_audience": "specific_player", "target_player_id": player_id}
            ]
        }).sort("created_at", -1).to_list(50)
        
        # Clean announcements for JSON serialization
        announcements = []
        for announcement in announcements_raw:
            clean_announcement = {
                "id": announcement.get("id"),
                "academy_id": announcement.get("academy_id"),
                "title": announcement.get("title"),
                "content": announcement.get("content"),
                "priority": announcement.get("priority"),
                "target_audience": announcement.get("target_audience"),
                "target_player_id": announcement.get("target_player_id"),
                "is_active": announcement.get("is_active"),
                "created_by": announcement.get("created_by"),
                "created_at": announcement.get("created_at").isoformat() if announcement.get("created_at") else None,
                "updated_at": announcement.get("updated_at").isoformat() if announcement.get("updated_at") else None
            }
            announcements.append(clean_announcement)
        
        return {"announcements": announcements}
        
    except Exception as e:
        logger.error(f"Error fetching player announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")

# Player Stats and Analytics
@api_router.get("/player/stats")
async def get_player_stats(user_info = Depends(require_player_user)):
    """Get comprehensive player statistics"""
    try:
        player_id = user_info["player_id"]
        academy_id = user_info["academy_id"]
        player = user_info["player"]
        
        # Get total attendance records
        total_attendance = await db.player_attendance.count_documents({"player_id": player_id})
        present_count = await db.player_attendance.count_documents({"player_id": player_id, "present": True})
        
        # Calculate attendance percentage
        attendance_percentage = (present_count / total_attendance * 100) if total_attendance > 0 else 0
        
        # Get recent attendance with performance ratings
        recent_attendance = await db.player_attendance.find({
            "player_id": player_id
        }).sort("date", -1).limit(30).to_list(30)
        
        # Calculate average performance ratings
        performance_averages = {}
        performance_count = {}
        
        for record in recent_attendance:
            if record.get("performance_ratings"):
                for category, rating in record["performance_ratings"].items():
                    if rating is not None:
                        if category not in performance_averages:
                            performance_averages[category] = 0
                            performance_count[category] = 0
                        performance_averages[category] += rating
                        performance_count[category] += 1
        
        # Calculate final averages
        for category in performance_averages:
            if performance_count[category] > 0:
                performance_averages[category] = performance_averages[category] / performance_count[category]
        
        # Overall performance score (average of all categories)
        overall_performance = sum(performance_averages.values()) / len(performance_averages) if performance_averages else 0
        overall_performance_scaled = (overall_performance / 10) * 100  # Scale to 0-100
        
        # Get coach information
        coach_name = None
        if player.get("coach_id"):
            coach = await db.coaches.find_one({"id": player["coach_id"]})
            if coach:
                coach_name = f"{coach.get('first_name', '')} {coach.get('last_name', '')}".strip()
        
        # Get academy info
        academy = await db.academies.find_one({"id": academy_id})
        academy_name = academy.get("name") if academy else "Unknown Academy"
        
        return {
            "player_id": player_id,
            "total_sessions": total_attendance,
            "attended_sessions": present_count,
            "attendance_percentage": round(attendance_percentage, 2),
            "overall_performance": round(overall_performance_scaled, 2),
            "performance_by_category": {k: round(v, 2) for k, v in performance_averages.items()},
            "coach_name": coach_name,
            "academy_name": academy_name,
            "sport": player.get("sport"),
            "recent_attendance_count": len(recent_attendance)
        }
        
    except Exception as e:
        logger.error(f"Error fetching player stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch player stats")

# Player Photo Upload (Self-upload)
@api_router.post("/player/upload-photo")
async def player_upload_photo(file: UploadFile = File(...), user_info = Depends(require_player_user)):
    """Allow player to upload their own photo"""
    try:
        player_id = user_info["player_id"]
        
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (500KB)
        content = await file.read()
        if len(content) > 500 * 1024:
            raise HTTPException(status_code=400, detail="Photo size must be less than 500KB")
        
        # Convert to base64
        import base64
        base64_photo = f"data:{file.content_type};base64,{base64.b64encode(content).decode()}"
        
        # Update player photo
        await db.players.update_one(
            {"id": player_id},
            {"$set": {"photo_url": base64_photo, "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Photo uploaded successfully", "photo_url": base64_photo}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading player photo: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload photo")

@api_router.delete("/player/photo")
async def delete_player_photo(user_info = Depends(require_player_user)):
    """Allow player to remove their photo"""
    try:
        player_id = user_info["player_id"]

        # Update player to remove photo
        await db.players.update_one(
            {"id": player_id},
            {"$set": {"photo_url": None, "updated_at": datetime.utcnow()}}
        )

        return {"message": "Photo removed successfully"}

    except Exception as e:
        logger.error(f"Error removing player photo: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove photo")

# Get Player Notification Preferences
@api_router.get("/player/notification-preferences")
async def get_player_notification_preferences(user_info = Depends(require_player_user)):
    """Get player notification preferences"""
    try:
        player_id = user_info["player_id"]
        
        # Check if preferences exist
        preferences = await db.player_preferences.find_one({"player_id": player_id})
        
        if not preferences:
            # Return defaults
            return {
                "email_notifications": True,
                "notification_priority": "all",  # all, important, none
                "push_notifications": True
            }
        
        return {
            "email_notifications": preferences.get("email_notifications", True),
            "notification_priority": preferences.get("notification_priority", "all"),
            "push_notifications": preferences.get("push_notifications", True)
        }
        
    except Exception as e:
        logger.error(f"Error fetching notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch preferences")

# Update Player Notification Preferences
@api_router.put("/player/notification-preferences")
async def update_player_notification_preferences(
    email_notifications: bool = True,
    notification_priority: str = "all",
    push_notifications: bool = True,
    user_info = Depends(require_player_user)
):
    """Update player notification preferences"""
    try:
        player_id = user_info["player_id"]
        
        # Validate notification_priority
        if notification_priority not in ["all", "important", "none"]:
            raise HTTPException(status_code=400, detail="Invalid notification priority")
        
        # Update or create preferences
        await db.player_preferences.update_one(
            {"player_id": player_id},
            {
                "$set": {
                    "email_notifications": email_notifications,
                    "notification_priority": notification_priority,
                    "push_notifications": push_notifications,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {"message": "Preferences updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

# Get Player Payment History
@api_router.get("/player/payment-history")
async def get_player_payment_history(user_info = Depends(require_player_user)):
    """Get payment history for player's academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get academy subscription info
        subscription = await db.academy_subscriptions.find_one({"academy_id": academy_id})
        
        # Get payment transactions
        payments = await db.payment_transactions.find({
            "academy_id": academy_id,
            "payment_status": "paid"
        }).sort("payment_date", -1).limit(12).to_list(12)
        
        # Clean payment data
        payment_history = []
        for payment in payments:
            payment_history.append({
                "id": payment.get("id"),
                "amount": payment.get("amount"),
                "currency": payment.get("currency"),
                "payment_date": payment.get("payment_date").isoformat() if payment.get("payment_date") else None,
                "payment_method": payment.get("payment_method"),
                "description": payment.get("description"),
                "billing_cycle": payment.get("billing_cycle")
            })
        
        # Calculate next payment info
        next_payment = None
        if subscription:
            next_payment = {
                "amount": subscription.get("amount"),
                "currency": subscription.get("currency"),
                "due_date": subscription.get("current_period_end").isoformat() if subscription.get("current_period_end") else None,
                "billing_cycle": subscription.get("billing_cycle"),
                "status": subscription.get("status")
            }
        
        return {
            "payment_history": payment_history,
            "next_payment": next_payment,
            "total_paid": sum([p.get("amount", 0) for p in payments])
        }
        
    except Exception as e:
        logger.error(f"Error fetching payment history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment history")

# Coach info for a player (assigned coach details)
@api_router.get("/player/coach-info")
async def get_player_coach_info(user_info = Depends(require_player_user), date: Optional[str] = None):
    try:
        player = user_info["player"]
        academy_id = user_info["academy_id"]
        coach_id = player.get("coach_id")
        if not coach_id:
            return {"coach": None}

        coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not coach:
            return {"coach": None}

        # Compute average coach rating over last 180 days
        time_limit = datetime.utcnow() - timedelta(days=180)
        ratings_cursor = db.coach_ratings.find({
            "academy_id": academy_id,
            "coach_id": coach_id,
            "created_at": {"$gte": time_limit}
        })
        ratings = await ratings_cursor.to_list(length=None)
        values = [r.get("rating") for r in ratings if isinstance(r.get("rating"), (int, float))]
        avg_rating_6m = round(sum(values) / len(values), 2) if values else None

        # Eligibility: allow coach rating only if player has a recent attendance
        # marked present AND performance ratings recorded (last 7 days)
        target_date = date or datetime.utcnow().strftime('%Y-%m-%d')
        eligible = await db.player_attendance.find_one({
            "academy_id": academy_id,
            "player_id": user_info["player_id"],
            "date": target_date,
            "present": True
        })
        can_rate = bool(eligible)

        coach_clean = {
            "id": coach.get("id"),
            "first_name": coach.get("first_name"),
            "last_name": coach.get("last_name"),
            "email": coach.get("email"),
            "phone": coach.get("phone"),
            "sports": coach.get("sports", []),
            "specialization": coach.get("specialization"),
            "experience_years": coach.get("experience_years"),
            "profile_picture_url": coach.get("profile_picture_url"),
            "description": coach.get("description")
        }

        return {"coach": coach_clean, "avg_coach_rating_6m": avg_rating_6m, "can_rate_coach": can_rate, "session_date": target_date}
    except Exception as e:
        logger.error(f"Error fetching player coach info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch coach info")

# Player submits rating for assigned coach
@api_router.post("/player/coach-rating")
async def submit_coach_rating(payload: CoachRatingCreate, user_info = Depends(require_player_user), date: Optional[str] = None):
    try:
        player = user_info["player"]
        player_id = user_info["player_id"]
        academy_id = user_info["academy_id"]
        coach_id = player.get("coach_id")
        if not coach_id:
            raise HTTPException(status_code=400, detail="No coach assigned to player")

        coach = await db.coaches.find_one({"id": coach_id, "academy_id": academy_id})
        if not coach:
            raise HTTPException(status_code=404, detail="Assigned coach not found")

        # Eligibility check: must have recent present attendance with performance ratings
        target_date = date or datetime.utcnow().strftime('%Y-%m-%d')
        eligible = await db.player_attendance.find_one({
            "academy_id": academy_id,
            "player_id": player_id,
            "date": target_date,
            "present": True
        })
        if not eligible:
            raise HTTPException(status_code=400, detail="Coach rating allowed only when attendance is marked present for the selected date")

        rating_doc = {
            "id": str(uuid.uuid4()),
            "academy_id": academy_id,
            "coach_id": coach_id,
            "player_id": player_id,
            "rating": int(payload.rating),
            "notes": payload.notes,
            "session_date": target_date,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        await db.coach_ratings.insert_one(rating_doc)

        return {"message": "Coach rating submitted", "rating": rating_doc["rating"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting coach rating: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit coach rating")

# Regenerate Player Password (Admin Only)
@api_router.post("/academy/players/{player_id}/regenerate-password")
async def regenerate_player_password(player_id: str, user_info = Depends(require_academy_user)):
    """Regenerate password for a player (Admin only)"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find player
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        if not player.get("email") or not player.get("supabase_user_id"):
            raise HTTPException(status_code=400, detail="Player does not have login credentials")
        
        # Generate new password
        new_password = generate_default_password()
        
        # Update password in Supabase
        try:
            supabase_admin.auth.admin.update_user_by_id(
                player["supabase_user_id"],
                {"password": new_password}
            )
        except Exception as e:
            logger.error(f"Failed to update Supabase password: {e}")
            raise HTTPException(status_code=500, detail="Failed to update password in authentication system")
        
        # Update player in database
        await db.players.update_one(
            {"id": player_id},
            {
                "$set": {
                    "default_password": new_password,
                    "password_changed": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "message": "Password regenerated successfully",
            "new_password": new_password,
            "player_email": player["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating player password: {e}")
        raise HTTPException(status_code=500, detail="Failed to regenerate password")

# ========== THEME PREFERENCE ENDPOINTS ==========

# Get Theme Preference
@api_router.get("/theme")
async def get_theme_preference():
    """Get global theme preference"""
    try:
        theme_pref = await db.theme_preferences.find_one({})
        if not theme_pref:
            # Create default theme preference
            default_theme = ThemePreference()
            await db.theme_preferences.insert_one(default_theme.dict())
            return {"theme": "light"}
        
        return {"theme": theme_pref.get("theme", "light")}
        
    except Exception as e:
        logger.error(f"Error fetching theme preference: {e}")
        return {"theme": "light"}  # Default fallback

# Update Theme Preference
@api_router.put("/theme")
async def update_theme_preference(theme: str):
    """Update global theme preference"""
    try:
        if theme not in ["light", "dark"]:
            raise HTTPException(status_code=400, detail="Theme must be 'light' or 'dark'")
        
        # Update or create theme preference
        await db.theme_preferences.update_one(
            {},
            {"$set": {"theme": theme, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        
        return {"message": "Theme updated successfully", "theme": theme}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating theme preference: {e}")
        raise HTTPException(status_code=500, detail="Failed to update theme preference")

# ========== BATCH/GROUP MANAGEMENT ENDPOINTS ==========

# Get All Batches
@api_router.get("/academy/batches")
async def get_academy_batches(user_info = Depends(require_academy_user)):
    """Get all batches for the academy"""
    try:
        academy_id = user_info["academy_id"]
        
        batches_raw = await db.batches.find({"academy_id": academy_id}).to_list(100)
        
        # Clean batches and get player counts
        batches = []
        for batch in batches_raw:
            batch.pop("_id", None)
            
            # Count players in batch
            player_count = await db.players.count_documents({
                "academy_id": academy_id,
                "batch_id": batch.get("id"),
                "status": "active"
            })
            batch["player_count"] = player_count
            
            # Clean dates
            if batch.get("created_at"):
                batch["created_at"] = batch["created_at"].isoformat()
            if batch.get("updated_at"):
                batch["updated_at"] = batch["updated_at"].isoformat()
            
            batches.append(batch)
        
        return {"batches": batches}
        
    except Exception as e:
        logger.error(f"Error fetching batches: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch batches")

# Create Batch
@api_router.post("/academy/batches")
async def create_batch(
    name: str,
    sport: str,
    skill_level: str,
    age_group: str = None,
    schedule_days: list = [],
    schedule_time: str = None,
    coach_id: str = None,
    max_players: int = 20,
    fee_amount: float = 0,
    user_info = Depends(require_academy_user)
):
    """Create a new batch"""
    try:
        academy_id = user_info["academy_id"]
        
        # Validate skill level
        valid_skill_levels = ["beginner", "intermediate", "advanced", "elite"]
        if skill_level not in valid_skill_levels:
            raise HTTPException(status_code=400, detail="Invalid skill level")
        
        # Create batch
        batch_id = str(uuid.uuid4())
        batch = {
            "id": batch_id,
            "academy_id": academy_id,
            "name": name,
            "sport": sport,
            "skill_level": skill_level,
            "age_group": age_group,
            "schedule_days": schedule_days,
            "schedule_time": schedule_time,
            "coach_id": coach_id,
            "max_players": max_players,
            "fee_amount": fee_amount,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.batches.insert_one(batch)
        
        return {"message": "Batch created successfully", "batch_id": batch_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating batch: {e}")
        raise HTTPException(status_code=500, detail="Failed to create batch")

# Update Batch
@api_router.put("/academy/batches/{batch_id}")
async def update_batch(
    batch_id: str,
    name: str = None,
    sport: str = None,
    skill_level: str = None,
    age_group: str = None,
    schedule_days: list = None,
    schedule_time: str = None,
    coach_id: str = None,
    max_players: int = None,
    fee_amount: float = None,
    status: str = None,
    user_info = Depends(require_academy_user)
):
    """Update batch details"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find batch
        batch = await db.batches.find_one({"id": batch_id, "academy_id": academy_id})
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow()}
        if name: update_data["name"] = name
        if sport: update_data["sport"] = sport
        if skill_level: update_data["skill_level"] = skill_level
        if age_group: update_data["age_group"] = age_group
        if schedule_days is not None: update_data["schedule_days"] = schedule_days
        if schedule_time: update_data["schedule_time"] = schedule_time
        if coach_id: update_data["coach_id"] = coach_id
        if max_players: update_data["max_players"] = max_players
        if fee_amount is not None: update_data["fee_amount"] = fee_amount
        if status: update_data["status"] = status
        
        await db.batches.update_one({"id": batch_id}, {"$set": update_data})
        
        return {"message": "Batch updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating batch: {e}")
        raise HTTPException(status_code=500, detail="Failed to update batch")

# Delete Batch
@api_router.delete("/academy/batches/{batch_id}")
async def delete_batch(batch_id: str, user_info = Depends(require_academy_user)):
    """Delete a batch"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if batch has players
        player_count = await db.players.count_documents({
            "academy_id": academy_id,
            "batch_id": batch_id,
            "status": "active"
        })
        
        if player_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete batch with {player_count} active players. Please reassign them first."
            )
        
        result = await db.batches.delete_one({"id": batch_id, "academy_id": academy_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        return {"message": "Batch deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting batch: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete batch")

# ========== TRAINING PLANS & SCHEDULES ENDPOINTS ==========

# Get All Training Plans
@api_router.get("/academy/training-plans")
async def get_training_plans(user_info = Depends(require_academy_user)):
    """Get all training plans for academy"""
    try:
        academy_id = user_info["academy_id"]
        
        plans_raw = await db.training_plans.find({"academy_id": academy_id}).to_list(100)
        
        plans = []
        for plan in plans_raw:
            plan.pop("_id", None)
            
            # Get review status from coaches
            reviews = await db.training_reviews.find({"plan_id": plan.get("id")}).to_list(100)
            plan["reviews"] = []
            for review in reviews:
                review.pop("_id", None)
                if review.get("reviewed_at"):
                    review["reviewed_at"] = review["reviewed_at"].isoformat()
                plan["reviews"].append(review)
            
            # Clean dates
            if plan.get("created_at"):
                plan["created_at"] = plan["created_at"].isoformat()
            if plan.get("updated_at"):
                plan["updated_at"] = plan["updated_at"].isoformat()
            if plan.get("start_date"):
                plan["start_date"] = plan["start_date"].isoformat()
            if plan.get("end_date"):
                plan["end_date"] = plan["end_date"].isoformat()
            
            plans.append(plan)
        
        return {"training_plans": plans}
        
    except Exception as e:
        logger.error(f"Error fetching training plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch training plans")

# Create Training Plan (Admin only)
@api_router.post("/academy/training-plans")
async def create_training_plan(
    plan_data: TrainingPlanCreate,
    user_info = Depends(require_academy_user)
):
    """Create a new training plan (Admin creates, coaches review)"""
    try:
        academy_id = user_info["academy_id"]
        
        # Parse dates
        start_date_obj = datetime.fromisoformat(plan_data.start_date.replace('Z', '+00:00')) if plan_data.start_date else None
        end_date_obj = datetime.fromisoformat(plan_data.end_date.replace('Z', '+00:00')) if plan_data.end_date else None
        
        # Create plan
        plan_id = str(uuid.uuid4())
        plan = {
            "id": plan_id,
            "academy_id": academy_id,
            "title": plan_data.title,
            "description": plan_data.description,
            "sport": plan_data.sport,
            "batch_id": plan_data.batch_id,
            "start_date": start_date_obj,
            "end_date": end_date_obj,
            "schedule": plan_data.schedule,  # {day: {time, drills, notes}}
            "drills": [drill.dict() for drill in plan_data.drills],  # [{ name, description, duration, focus_area }]
            "goals": [goal.dict() for goal in plan_data.goals],  # [{ description, target_date }]
            "status": "pending_review",
            "created_by": user_info["user"].id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.training_plans.insert_one(plan)
        
        # Notify coaches assigned to the batch
        if plan_data.batch_id:
            batch = await db.batches.find_one({"id": plan_data.batch_id})
            if batch and batch.get("coach_id"):
                notification = {
                    "id": str(uuid.uuid4()),
                    "coach_id": batch["coach_id"],
                    "academy_id": academy_id,
                    "type": "training_plan_review",
                    "title": "New Training Plan for Review",
                    "message": f"A new training plan '{plan_data.title}' has been created and requires your review.",
                    "plan_id": plan_id,
                    "read": False,
                    "created_at": datetime.utcnow()
                }
                await db.notifications.insert_one(notification)
        
        return {"message": "Training plan created successfully", "plan_id": plan_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating training plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to create training plan")

# Coach Review Training Plan
@api_router.post("/coach/training-plans/{plan_id}/review")
async def review_training_plan(
    plan_id: str,
    action: str,  # "approve" or "flag"
    comments: str = None,
    user_info = Depends(require_coach_user)
):
    """Coach reviews and approves/flags training plan"""
    try:
        coach_id = user_info["coach_id"]
        academy_id = user_info["academy_id"]
        
        # Validate action
        if action not in ["approve", "flag"]:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'flag'")
        
        # Find plan
        plan = await db.training_plans.find_one({"id": plan_id, "academy_id": academy_id})
        if not plan:
            raise HTTPException(status_code=404, detail="Training plan not found")
        
        # Create review record
        review_id = str(uuid.uuid4())
        review = {
            "id": review_id,
            "plan_id": plan_id,
            "coach_id": coach_id,
            "academy_id": academy_id,
            "action": action,
            "comments": comments,
            "reviewed_at": datetime.utcnow()
        }
        
        await db.training_reviews.insert_one(review)
        
        # Update plan status
        new_status = "approved" if action == "approve" else "flagged"
        await db.training_plans.update_one(
            {"id": plan_id},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
        )
        
        # Notify admin
        notification = {
            "id": str(uuid.uuid4()),
            "academy_id": academy_id,
            "type": "training_plan_reviewed",
            "title": f"Training Plan {action.title()}d",
            "message": f"Coach has {action}d the training plan '{plan.get('title')}'. {comments or ''}",
            "plan_id": plan_id,
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        return {"message": f"Training plan {action}d successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing training plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to review training plan")

# ========== CERTIFICATES & ACHIEVEMENTS ENDPOINTS ==========

# Get Player Achievements
@api_router.get("/academy/players/{player_id}/achievements")
async def get_player_achievements(player_id: str, user_info = Depends(require_academy_user)):
    """Get achievements for a player"""
    try:
        academy_id = user_info["academy_id"]
        
        achievements_raw = await db.achievements.find({
            "player_id": player_id,
            "academy_id": academy_id
        }).to_list(100)
        
        achievements = []
        for ach in achievements_raw:
            ach.pop("_id", None)
            if ach.get("earned_at"):
                ach["earned_at"] = ach["earned_at"].isoformat()
            achievements.append(ach)
        
        return {"achievements": achievements}
        
    except Exception as e:
        logger.error(f"Error fetching achievements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch achievements")

# Award Achievement to Player
@api_router.post("/academy/players/{player_id}/achievements")
async def award_achievement(
    player_id: str,
    title: str,
    description: str,
    badge_type: str,  # "attendance", "performance", "milestone", "tournament"
    metadata: dict = {},
    user_info = Depends(require_academy_user)
):
    """Award an achievement badge to a player"""
    try:
        academy_id = user_info["academy_id"]
        
        # Verify player
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Create achievement
        achievement_id = str(uuid.uuid4())
        achievement = {
            "id": achievement_id,
            "player_id": player_id,
            "academy_id": academy_id,
            "title": title,
            "description": description,
            "badge_type": badge_type,
            "metadata": metadata,
            "earned_at": datetime.utcnow(),
            "awarded_by": user_info["user_id"]
        }
        
        await db.achievements.insert_one(achievement)
        
        # Notify player
        notification = {
            "id": str(uuid.uuid4()),
            "player_id": player_id,
            "academy_id": academy_id,
            "type": "achievement_earned",
            "title": "New Achievement Earned! 🏆",
            "message": f"Congratulations! You've earned: {title}",
            "achievement_id": achievement_id,
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        return {"message": "Achievement awarded successfully", "achievement_id": achievement_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error awarding achievement: {e}")
        raise HTTPException(status_code=500, detail="Failed to award achievement")

# Generate Certificate
@api_router.post("/academy/players/{player_id}/certificate")
async def generate_certificate(
    player_id: str,
    certificate_type: str,  # "completion", "achievement", "participation"
    title: str,
    description: str,
    issue_date: str = None,
    user_info = Depends(require_academy_user)
):
    """Generate a certificate for a player"""
    try:
        academy_id = user_info["academy_id"]
        
        # Verify player
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Get academy info
        academy = await db.academies.find_one({"id": academy_id})
        
        issue_date_obj = datetime.fromisoformat(issue_date.replace('Z', '+00:00')) if issue_date else datetime.utcnow()
        
        # Create certificate record
        certificate_id = str(uuid.uuid4())
        certificate = {
            "id": certificate_id,
            "player_id": player_id,
            "academy_id": academy_id,
            "certificate_type": certificate_type,
            "title": title,
            "description": description,
            "player_name": f"{player.get('first_name')} {player.get('last_name')}",
            "academy_name": academy.get("name"),
            "issue_date": issue_date_obj,
            "certificate_number": f"CERT-{academy_id[:8]}-{certificate_id[:8]}",
            "status": "issued",
            "created_at": datetime.utcnow()
        }
        
        await db.certificates.insert_one(certificate)
        
        # Notify player
        notification = {
            "id": str(uuid.uuid4()),
            "player_id": player_id,
            "academy_id": academy_id,
            "type": "certificate_issued",
            "title": "Certificate Issued 📜",
            "message": f"A new certificate has been issued: {title}",
            "certificate_id": certificate_id,
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        return {
            "message": "Certificate generated successfully",
            "certificate_id": certificate_id,
            "certificate_number": certificate["certificate_number"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating certificate: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate certificate")

# Get Leaderboard
@api_router.get("/academy/leaderboard")
async def get_leaderboard(
    sport: str = None,
    batch_id: str = None,
    metric: str = "overall",  # "overall", "attendance", "performance"
    limit: int = 10,
    user_info = Depends(require_academy_user)
):
    """Get leaderboard for players"""
    try:
        academy_id = user_info["academy_id"]
        
        # Build query
        query = {"academy_id": academy_id, "status": "active"}
        if sport:
            query["sport"] = sport
        if batch_id:
            query["batch_id"] = batch_id
        
        players = await db.players.find(query).to_list(1000)
        
        # Calculate scores for each player
        leaderboard = []
        for player in players:
            player_id = player["id"]
            
            # Get attendance percentage
            total_attendance = await db.player_attendance.count_documents({"player_id": player_id})
            present_count = await db.player_attendance.count_documents({"player_id": player_id, "present": True})
            attendance_pct = (present_count / total_attendance * 100) if total_attendance > 0 else 0
            
            # Get average performance
            recent_attendance = await db.player_attendance.find({
                "player_id": player_id
            }).sort("date", -1).limit(30).to_list(30)
            
            performance_scores = []
            for record in recent_attendance:
                if record.get("performance_ratings"):
                    scores = [v for v in record["performance_ratings"].values() if v is not None]
                    if scores:
                        performance_scores.extend(scores)
            
            avg_performance = (sum(performance_scores) / len(performance_scores)) if performance_scores else 0
            performance_pct = (avg_performance / 10) * 100
            
            # Calculate overall score
            if metric == "attendance":
                score = attendance_pct
            elif metric == "performance":
                score = performance_pct
            else:  # overall
                score = (attendance_pct * 0.4) + (performance_pct * 0.6)
            
            # Get achievement count
            achievement_count = await db.achievements.count_documents({
                "player_id": player_id,
                "academy_id": academy_id
            })
            
            leaderboard.append({
                "player_id": player_id,
                "player_name": f"{player.get('first_name')} {player.get('last_name')}",
                "sport": player.get("sport"),
                "batch_id": player.get("batch_id"),
                "score": round(score, 2),
                "attendance_percentage": round(attendance_pct, 2),
                "performance_score": round(performance_pct, 2),
                "achievement_count": achievement_count,
                "photo_url": player.get("photo_url")
            })
        
        # Sort by score
        leaderboard.sort(key=lambda x: x["score"], reverse=True)
        
        # Add rank
        for i, entry in enumerate(leaderboard[:limit]):
            entry["rank"] = i + 1
        
        return {"leaderboard": leaderboard[:limit]}
        
    except Exception as e:
        logger.error(f"Error generating leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate leaderboard")

# ========== ADVANCED ANALYTICS ENDPOINTS ==========

# Get Predictive Performance
@api_router.get("/academy/analytics/predictive-performance/{player_id}")
async def get_predictive_performance(player_id: str, user_info = Depends(require_academy_user)):
    """Get predictive performance analysis for a player"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get historical performance data (last 90 days)
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        attendance_records = await db.player_attendance.find({
            "player_id": player_id,
            "date": {"$gte": ninety_days_ago}
        }).sort("date", 1).to_list(100)
        
        if len(attendance_records) < 5:
            return {
                "message": "Insufficient data for prediction",
                "prediction": None,
                "confidence": 0
            }
        
        # Extract performance trends
        performance_trend = []
        for record in attendance_records:
            if record.get("performance_ratings"):
                scores = [v for v in record["performance_ratings"].values() if v is not None]
                if scores:
                    avg_score = sum(scores) / len(scores)
                    performance_trend.append({
                        "date": record["date"].isoformat(),
                        "score": avg_score
                    })
        
        # Simple linear regression for trend
        if len(performance_trend) >= 3:
            x_values = list(range(len(performance_trend)))
            y_values = [p["score"] for p in performance_trend]
            
            # Calculate slope
            n = len(x_values)
            sum_x = sum(x_values)
            sum_y = sum(y_values)
            sum_xy = sum(x * y for x, y in zip(x_values, y_values))
            sum_x2 = sum(x * x for x in x_values)
            
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) if (n * sum_x2 - sum_x * sum_x) != 0 else 0
            intercept = (sum_y - slope * sum_x) / n
            
            # Predict next 30 days
            future_predictions = []
            for i in range(30):
                future_x = len(x_values) + i
                predicted_score = slope * future_x + intercept
                predicted_score = max(0, min(10, predicted_score))  # Clamp between 0-10
                
                future_date = datetime.utcnow() + timedelta(days=i)
                future_predictions.append({
                    "date": future_date.isoformat(),
                    "predicted_score": round(predicted_score, 2)
                })
            
            # Calculate trend direction
            trend_direction = "improving" if slope > 0.05 else "declining" if slope < -0.05 else "stable"
            
            # Calculate confidence based on data consistency
            if len(y_values) > 1:
                mean_y = sum(y_values) / len(y_values)
                variance = sum((y - mean_y) ** 2 for y in y_values) / len(y_values)
                confidence = max(0, min(100, 100 - (variance * 5)))  # Lower variance = higher confidence
            else:
                confidence = 50
            
            return {
                "player_id": player_id,
                "historical_performance": performance_trend,
                "predicted_performance": future_predictions,
                "trend_direction": trend_direction,
                "trend_slope": round(slope, 4),
                "confidence": round(confidence, 2),
                "recommendation": get_performance_recommendation(trend_direction, y_values[-1] if y_values else 5)
            }
        
        return {
            "message": "Insufficient data for prediction",
            "historical_performance": performance_trend,
            "prediction": None
        }
        
    except Exception as e:
        logger.error(f"Error calculating predictive performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate predictive performance")

def get_performance_recommendation(trend, current_score):
    """Generate performance recommendation based on trend and score"""
    if trend == "improving" and current_score >= 7:
        return "Excellent progress! Continue with current training regimen."
    elif trend == "improving" and current_score < 7:
        return "Showing improvement. Focus on consistency to reach peak performance."
    elif trend == "declining" and current_score >= 7:
        return "Performance declining from high level. Review training intensity and recovery."
    elif trend == "declining":
        return "Performance declining. Immediate attention needed. Consider one-on-one coaching."
    elif trend == "stable" and current_score >= 7:
        return "Maintaining good performance. Challenge with advanced drills."
    else:
        return "Performance stable but below potential. Increase training focus."

# Get Academy Analytics Dashboard
@api_router.get("/academy/analytics/dashboard")
async def get_analytics_dashboard(user_info = Depends(require_academy_user)):
    """Get comprehensive analytics for academy dashboard"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get total counts
        total_players = await db.players.count_documents({"academy_id": academy_id, "status": "active"})
        total_coaches = await db.coaches.count_documents({"academy_id": academy_id, "status": "active"})
        total_batches = await db.batches.count_documents({"academy_id": academy_id, "status": "active"})
        
        # Get retention rate (players active > 3 months)
        three_months_ago = datetime.utcnow() - timedelta(days=90)
        retained_players = await db.players.count_documents({
            "academy_id": academy_id,
            "status": "active",
            "created_at": {"$lte": three_months_ago}
        })
        retention_rate = (retained_players / total_players * 100) if total_players > 0 else 0
        
        # Get average attendance
        all_attendance = await db.player_attendance.count_documents({"academy_id": academy_id})
        present_attendance = await db.player_attendance.count_documents({"academy_id": academy_id, "present": True})
        avg_attendance = (present_attendance / all_attendance * 100) if all_attendance > 0 else 0
        
        # Get revenue (from payment transactions)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        revenue_pipeline = [
            {"$match": {"academy_id": academy_id, "payment_status": "paid", "payment_date": {"$gte": thirty_days_ago}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        revenue_result = await db.payment_transactions.aggregate(revenue_pipeline).to_list(1)
        monthly_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        # Get growth trend (last 6 months)
        growth_trend = []
        for i in range(6):
            month_start = datetime.utcnow() - timedelta(days=30 * (i + 1))
            month_end = datetime.utcnow() - timedelta(days=30 * i)
            
            player_count = await db.players.count_documents({
                "academy_id": academy_id,
                "created_at": {"$gte": month_start, "$lt": month_end}
            })
            
            growth_trend.insert(0, {
                "month": month_start.strftime("%b %Y"),
                "new_players": player_count
            })
        
        return {
            "total_players": total_players,
            "total_coaches": total_coaches,
            "total_batches": total_batches,
            "retention_rate": round(retention_rate, 2),
            "average_attendance": round(avg_attendance, 2),
            "monthly_revenue": monthly_revenue,
            "growth_trend": growth_trend
        }
        
    except Exception as e:
        logger.error(f"Error generating analytics dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate analytics")

# Academy-wide Skill Radar (aggregate performance ratings across attendance)
@api_router.get("/academy/analytics/skill-radar")
async def get_academy_skill_radar(
    target: float = 8.0,
    user_info = Depends(require_academy_user)
):
    """Aggregate player_attendance.performance_ratings across the academy and
    compute average per category for radar visualization.

    Returns categories with average scores (0–10), a target benchmark, and
    basic insights about strengths and weaknesses.
    """
    try:
        academy_id = user_info["academy_id"]
        active_player_ids = await _get_active_player_ids(academy_id)
        time_limit = datetime.utcnow() - timedelta(days=180)
        cursor = db.player_attendance.find({
            "academy_id": academy_id,
            "player_id": {"$in": active_player_ids},
            "present": True,
            "created_at": {"$gte": time_limit}
        })
        records = await cursor.to_list(length=None)

        # Default categories to ensure consistent radar shape
        default_categories = [
            "Technical Skills",
            "Physical Fitness",
            "Tactical Awareness",
            "Mental Strength",
            "Teamwork"
        ]
        agg = _aggregate_academy_ratings(records, default_categories)
        categories = agg["categories"]
        rated_count = agg["rated_count"]

        weaknesses = [c["name"] for c in categories if c["average"] < max(0.0, target - 1.0)]
        strengths = [c["name"] for c in categories if c["average"] >= target]

        return {
            "categories": categories,
            "target": target,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "rated_count": rated_count
        }
    except Exception as e:
        logger.error(f"Error generating academy skill radar: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate academy skill radar")

@api_router.get("/academy/analytics/sport-skill-radar")
async def get_sport_skill_radar(
    target: float = 8.0,
    user_info = Depends(require_academy_user)
):
    try:
        academy_id = user_info["academy_id"]
        active_player_ids = await _get_active_player_ids(academy_id)
        time_limit = datetime.utcnow() - timedelta(days=180)
        cursor = db.player_attendance.find({
            "academy_id": academy_id,
            "player_id": {"$in": active_player_ids},
            "present": True,
            "created_at": {"$gte": time_limit}
        })
        records = await cursor.to_list(length=None)

        result_sports = _aggregate_sport_ratings(records)
        # Enrich with strengths/weaknesses using target
        for s in result_sports:
            weaknesses = [c["name"] for c in s["categories"] if c["average"] < max(0.0, target - 1.0)]
            strengths = [c["name"] for c in s["categories"] if c["average"] >= target]
            s["weaknesses"] = weaknesses
            s["strengths"] = strengths

        return {"target": target, "sports": result_sports}
    except Exception as e:
        logger.error(f"Error generating sport-wise skill radar: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate sport-wise skill radar")

# Backward-compatible aliases for environments using older routes
@api_router.get("/analytics/skill-radar")
async def get_academy_skill_radar_alias(target: float = 8.0, user_info = Depends(require_academy_user)):
    return await get_academy_skill_radar(target=target, user_info=user_info)

@api_router.get("/analytics/sport-skill-radar")
async def get_sport_skill_radar_alias(target: float = 8.0, user_info = Depends(require_academy_user)):
    return await get_sport_skill_radar(target=target, user_info=user_info)

@api_router.get("/academy/analytics/sport-radar")
async def get_sport_radar_alias(target: float = 8.0, user_info = Depends(require_academy_user)):
    return await get_sport_skill_radar(target=target, user_info=user_info)

@api_router.get("/academy/sport-skill-radar")
async def get_sport_skill_radar_alias2(target: float = 8.0, user_info = Depends(require_academy_user)):
    return await get_sport_skill_radar(target=target, user_info=user_info)

@api_router.get("/academy/skill-radar")
async def get_skill_radar_alias2(target: float = 8.0, user_info = Depends(require_academy_user)):
    return await get_academy_skill_radar(target=target, user_info=user_info)

@api_router.get("/academy/analytics/coach-comparison")
async def get_coach_comparison(
    coach_a: Optional[str] = None,
    coach_b: Optional[str] = None,
    months: int = 6,
    user_info = Depends(require_academy_user)
):
    try:
        academy_id = user_info["academy_id"]

        def month_key(dt: datetime) -> str:
            return dt.strftime("%Y-%m")

        end_date = datetime.utcnow()
        start_date = (end_date.replace(day=1) - timedelta(days=1))  # last month end
        # compute start_date months back by going to first day of end month and subtract months
        # simple approx: subtract 30*months days
        start_date = end_date - timedelta(days=months * 30)
        start_str = start_date.strftime("%Y-%m-%d")

        coaches_cursor = db.coaches.find({"academy_id": academy_id, "status": "active"})
        coaches_list = await coaches_cursor.to_list(length=None)
        coach_index = {c["id"]: c for c in coaches_list}

        # Helper to compute per-coach aggregates
        async def compute_for_coach(cid: str):
            players_cursor = db.players.find({"academy_id": academy_id, "coach_id": cid})
            players = await players_cursor.to_list(length=None)
            player_ids = [p["id"] for p in players]

            perf_cursor = db.performance_metrics.find({
                "academy_id": academy_id,
                "player_id": {"$in": player_ids},
                "date": {"$gte": start_str}
            })
            perf_records = await perf_cursor.to_list(length=None)

            # group by player
            by_player: Dict[str, List[Dict[str, Any]]] = {}
            for rec in perf_records:
                pid = rec["player_id"]
                by_player.setdefault(pid, []).append(rec)

            def slope_of_series(series: List[float]) -> float:
                n = len(series)
                if n < 2:
                    return 0.0
                # x = 1..n
                sx = n * (n + 1) / 2
                sx2 = n * (n + 1) * (2 * n + 1) / 6
                sy = sum(series)
                sxy = sum((i + 1) * v for i, v in enumerate(series))
                denom = (n * sx2 - sx * sx)
                if denom == 0:
                    return 0.0
                return (n * sxy - sx * sy) / denom

            player_avgs: List[float] = []
            player_slopes: List[float] = []
            player_deltas: List[float] = []

            for pid, recs in by_player.items():
                # sort by date
                recs_sorted = sorted(recs, key=lambda r: r["date"])  # ISO strings sort correctly
                ratings = [r.get("overall_rating") for r in recs_sorted if r.get("overall_rating") is not None]
                if not ratings:
                    continue
                player_avgs.append(sum(ratings) / len(ratings))
                player_slopes.append(slope_of_series(ratings))
                player_deltas.append(ratings[-1] - ratings[0])

            avg_rating_6m = round(sum(player_avgs) / len(player_avgs), 2) if player_avgs else None
            improvement_rate = round(sum(player_slopes) / len(player_slopes), 3) if player_slopes else 0.0
            avg_delta_6m = round(sum(player_deltas) / len(player_deltas), 2) if player_deltas else 0.0

            # Monthly series (average of all players per month)
            months_map: Dict[str, List[float]] = {}
            for rec in perf_records:
                r = rec.get("overall_rating")
                if r is None:
                    continue
                # parse date string YYYY-MM-DD
                try:
                    dt = datetime.strptime(rec["date"], "%Y-%m-%d")
                except Exception:
                    # if not parseable, bucket by first 7 chars
                    mk = rec["date"][:7]
                else:
                    mk = month_key(dt)
                months_map.setdefault(mk, []).append(float(r))
            monthly_series = [
                {"month": m, "average_rating": round(sum(vals) / len(vals), 2)}
                for m, vals in sorted(months_map.items())
            ]

            # Average coach rating from player submissions in last 6 months
            rating_time_limit = datetime.utcnow() - timedelta(days=180)
            coach_ratings_cursor = db.coach_ratings.find({
                "academy_id": academy_id,
                "coach_id": cid,
                "created_at": {"$gte": rating_time_limit}
            })
            coach_ratings = await coach_ratings_cursor.to_list(length=None)
            rating_values = [r.get("rating") for r in coach_ratings if isinstance(r.get("rating"), (int, float))]
            avg_coach_rating_6m = round(sum(rating_values) / len(rating_values), 2) if rating_values else None

            # Build monthly series for coach ratings
            coach_months_map: Dict[str, List[float]] = {}
            for r in coach_ratings:
                val = r.get("rating")
                if not isinstance(val, (int, float)):
                    continue
                ts = r.get("created_at")
                mk = None
                if isinstance(ts, datetime):
                    mk = month_key(ts)
                elif isinstance(ts, str):
                    try:
                        dt = datetime.strptime(ts[:10], "%Y-%m-%d")
                        mk = month_key(dt)
                    except Exception:
                        mk = ts[:7]
                else:
                    mk = end_date.strftime("%Y-%m")
                coach_months_map.setdefault(mk, []).append(float(val))
            coach_rating_series = [
                {"month": m, "avg_coach_rating": round(sum(vals) / len(vals), 2)}
                for m, vals in sorted(coach_months_map.items())
            ]

            coach = coach_index.get(cid)
            return {
                "coach_id": cid,
                "coach_name": f"{coach.get('first_name','')} {coach.get('last_name','')}" if coach else cid,
                "player_count": len(player_ids),
                "avg_rating_6m": avg_rating_6m,
                "improvement_rate": improvement_rate,
                "avg_delta_6m": avg_delta_6m,
                "monthly_series": monthly_series,
                "avg_coach_rating_6m": avg_coach_rating_6m,
                "coach_rating_series": coach_rating_series
            }

        # If no coach ids provided, select first two active coaches
        ids = [c["id"] for c in coaches_list]
        if not coach_a and ids:
            coach_a = ids[0]
        if not coach_b and len(ids) > 1:
            coach_b = ids[1]

        result_a = await compute_for_coach(coach_a) if coach_a else None
        result_b = await compute_for_coach(coach_b) if coach_b else None

        # Leaderboard for all coaches by avg_delta_6m
        leaderboard: List[Dict[str, Any]] = []
        for cid in ids:
            leaderboard.append(await compute_for_coach(cid))
        leaderboard.sort(key=lambda x: x.get("avg_delta_6m", 0.0), reverse=True)

        return {
            "months": months,
            "coach_a": result_a,
            "coach_b": result_b,
            "leaderboard": leaderboard
        }
    except Exception as e:
        logger.error(f"Error generating coach comparison: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate coach comparison")

# ========== FEE MANAGEMENT ENDPOINTS ==========

# Get Academy Fee Structure
@api_router.get("/academy/fee-structure")
async def get_academy_fee_structure(user_info = Depends(require_academy_user)):
    """Get fee structure for the academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get fee structure from database
        fee_structure = await db.academy_fee_structure.find_one({"academy_id": academy_id})
        
        if not fee_structure:
            # Return default structure if none exists
            return {
                "academy_id": academy_id,
                "sport_fees": {},
                "default_frequency": "monthly",
                "currency": "INR"
            }
        
        # Clean MongoDB ObjectId
        fee_structure.pop("_id", None)
        return fee_structure
        
    except Exception as e:
        logger.error(f"Error fetching fee structure: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch fee structure")

# Update Academy Fee Structure
@api_router.put("/academy/fee-structure")
async def update_academy_fee_structure(
    sport_fees: dict,
    default_frequency: str = "monthly",
    currency: str = "INR",
    user_info = Depends(require_academy_user)
):
    """Update fee structure for the academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Validate frequency
        valid_frequencies = ["monthly", "quarterly", "half_yearly", "annual"]
        if default_frequency not in valid_frequencies:
            raise HTTPException(status_code=400, detail="Invalid frequency")
        
        # Update or create fee structure
        await db.academy_fee_structure.update_one(
            {"academy_id": academy_id},
            {
                "$set": {
                    "sport_fees": sport_fees,
                    "default_frequency": default_frequency,
                    "currency": currency,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {"message": "Fee structure updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating fee structure: {e}")
        raise HTTPException(status_code=500, detail="Failed to update fee structure")

# Get All Student Fees
@api_router.get("/academy/student-fees")
async def get_all_student_fees(user_info = Depends(require_academy_user)):
    """Get fee records for all students in the academy"""
    try:
        academy_id = user_info["academy_id"]
        
        # Get all players
        players = await db.players.find({"academy_id": academy_id, "status": "active"}).to_list(1000)
        
        # Get fee records
        fee_records = []
        for player in players:
            # Get latest fee record for player
            fee_record = await db.student_fees.find_one(
                {"player_id": player["id"], "academy_id": academy_id},
                sort=[("created_at", -1)]
            )
            
            if not fee_record:
                # Create default fee record
                fee_record = {
                    "player_id": player["id"],
                    "academy_id": academy_id,
                    "amount": 0,
                    "frequency": "monthly",
                    "status": "pending",
                    "due_date": None,
                    "paid_date": None
                }
            
            # Add player info
            fee_record["player_name"] = f"{player.get('first_name', '')} {player.get('last_name', '')}".strip()
            fee_record["player_email"] = player.get("email")
            fee_record["sport"] = player.get("sport")
            fee_record["age"] = player.get("age")
            fee_record["registration_number"] = player.get("registration_number")
            
            # Clean MongoDB ObjectId
            fee_record.pop("_id", None)
            
            # Convert dates to ISO format
            if fee_record.get("due_date"):
                fee_record["due_date"] = fee_record["due_date"].isoformat() if hasattr(fee_record["due_date"], "isoformat") else fee_record["due_date"]
            if fee_record.get("paid_date"):
                fee_record["paid_date"] = fee_record["paid_date"].isoformat() if hasattr(fee_record["paid_date"], "isoformat") else fee_record["paid_date"]
            if fee_record.get("created_at"):
                fee_record["created_at"] = fee_record["created_at"].isoformat() if hasattr(fee_record["created_at"], "isoformat") else fee_record["created_at"]
            
            fee_records.append(fee_record)
        
        return {"fee_records": fee_records}
        
    except Exception as e:
        logger.error(f"Error fetching student fees: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student fees")

# Create/Update Student Fee Record
@api_router.post("/academy/student-fees/{player_id}")
async def create_or_update_student_fee(
    player_id: str,
    fee_data: StudentFeeCreate,
    user_info = Depends(require_academy_user)
):
    """Create or update fee record for a student"""
    try:
        academy_id = user_info["academy_id"]
        
        # Verify player belongs to academy
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Parse due date
        due_date_obj = datetime.fromisoformat(fee_data.due_date.replace('Z', '+00:00'))

        # Set paid_date based on status
        paid_date = datetime.utcnow() if fee_data.status == "paid" else None

        # Check if fee record already exists
        existing_fee = await db.student_fees.find_one({"player_id": player_id, "academy_id": academy_id})

        if existing_fee:
            # Update existing record
            update_data = {
                "amount": fee_data.amount,
                "frequency": fee_data.frequency,
                "due_date": due_date_obj,
                "status": fee_data.status,
                "paid_date": paid_date,
                "notes": fee_data.notes,
                "updated_at": datetime.utcnow()
            }
            await db.student_fees.update_one(
                {"player_id": player_id, "academy_id": academy_id},
                {"$set": update_data}
            )
            fee_record_id = existing_fee["id"]
        else:
            # Create new fee record
            fee_record_id = str(uuid.uuid4())
            fee_record = {
                "id": fee_record_id,
                "player_id": player_id,
                "academy_id": academy_id,
                "amount": fee_data.amount,
                "frequency": fee_data.frequency,
                "due_date": due_date_obj,
                "status": fee_data.status,
                "paid_date": paid_date,
                "notes": fee_data.notes,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.student_fees.insert_one(fee_record)
        
        # Create in-app notification for student
        notification = {
            "id": str(uuid.uuid4()),
            "player_id": player_id,
            "academy_id": academy_id,
            "type": "fee_due",
            "title": "Fee Payment Due",
            "message": f"Your {fee_data.frequency} fee of ₹{fee_data.amount} is due on {due_date_obj.strftime('%d %b %Y')}",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        return {"message": "Fee record created successfully", "fee_record_id": fee_record_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating student fee: {e}")
        raise HTTPException(status_code=500, detail="Failed to create fee record")

# Mark Fee as Paid
@api_router.put("/academy/student-fees/{fee_record_id}/mark-paid")
async def mark_fee_as_paid(
    fee_record_id: str,
    payment_method: str = "cash",
    transaction_id: str = None,
    user_info = Depends(require_academy_user)
):
    """Mark a fee record as paid"""
    try:
        academy_id = user_info["academy_id"]
        
        # Find fee record
        fee_record = await db.student_fees.find_one({"id": fee_record_id, "academy_id": academy_id})
        if not fee_record:
            raise HTTPException(status_code=404, detail="Fee record not found")
        
        # Update fee record
        await db.student_fees.update_one(
            {"id": fee_record_id},
            {
                "$set": {
                    "status": "paid",
                    "paid_date": datetime.utcnow(),
                    "payment_method": payment_method,
                    "transaction_id": transaction_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Create payment transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "academy_id": academy_id,
            "player_id": fee_record["player_id"],
            "amount": fee_record["amount"],
            "currency": "INR",
            "payment_method": payment_method,
            "transaction_id": transaction_id,
            "payment_status": "paid",
            "payment_date": datetime.utcnow(),
            "description": f"{fee_record.get('frequency', 'monthly')} fee payment",
            "billing_cycle": fee_record.get('frequency', 'monthly')
        }
        await db.payment_transactions.insert_one(transaction)
        
        # Create notification for student
        notification = {
            "id": str(uuid.uuid4()),
            "player_id": fee_record["player_id"],
            "academy_id": academy_id,
            "type": "fee_paid",
            "title": "Payment Received",
            "message": f"Your payment of ₹{fee_record['amount']} has been received. Thank you!",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)
        
        return {"message": "Fee marked as paid successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking fee as paid: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark fee as paid")

# Send Fee Reminder Email
@api_router.post("/academy/student-fees/{player_id}/send-reminder")
async def send_fee_reminder_email(
    player_id: str,
    user_info = Depends(require_academy_user)
):
    """Send fee reminder email to student"""
    try:
        academy_id = user_info["academy_id"]

        # Get player
        player = await db.players.find_one({"id": player_id, "academy_id": academy_id})
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")

        if not player.get("email"):
            raise HTTPException(status_code=400, detail="Player does not have an email")

        # Get academy info
        academy = await db.academies.find_one({"id": academy_id})

        # Get latest unpaid fee (due or pending status)
        fee_record = await db.student_fees.find_one(
            {
                "player_id": player_id,
                "academy_id": academy_id,
                "status": {"$in": ["due", "pending"]}
            },
            sort=[("due_date", 1)]
        )

        if not fee_record:
            raise HTTPException(status_code=404, detail="No unpaid fee found")

        # Send email using Zoho Mail API (OAuth-based, NOT SMTP)
        # This is for AUTOMATIC reminders triggered by button click
        player_name = f"{player.get('first_name', '')} {player.get('last_name', '')}".strip() or player.get('name', 'Student')
        academy_name = academy.get("name", "Your Academy")

        try:
            # Use Zoho Mail API for automatic reminders
            logger.info(f"Sending automatic fee reminder via Zoho Mail API to {player['email']}")
            email_sent = send_email_reminder_zoho(
                to_email=player["email"],
                player_name=player_name,
                academy_name=academy_name,
                fee_amount=fee_record["amount"],
                due_date=fee_record["due_date"],
                frequency=fee_record.get("frequency", "monthly")
            )
            logger.info(f"✅ Automatic reminder sent successfully to {player['email']}")
        except Exception as email_error:
            logger.error(f"Failed to send email via Zoho Mail API: {email_error}")
            # Fall back to False but continue with notification
            email_sent = False

        if not email_sent:
            logger.warning(f"Email sending failed for player {player_id}, but creating in-app notification")

        # Create in-app notification
        notification = {
            "id": str(uuid.uuid4()),
            "player_id": player_id,
            "academy_id": academy_id,
            "type": "fee_reminder",
            "title": "Fee Payment Reminder",
            "message": f"Reminder: Your {fee_record.get('frequency', 'monthly')} fee of ₹{fee_record['amount']} is due on {fee_record['due_date'].strftime('%d %b %Y')}. Please make the payment at the earliest.",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)

        # Update last_reminder_sent timestamp
        await db.student_fees.update_one(
            {"player_id": player_id, "academy_id": academy_id},
            {"$set": {"last_reminder_sent": datetime.utcnow()}}
        )

        return {
            "message": "Fee reminder sent successfully",
            "email_sent": email_sent,
            "notification_created": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending fee reminder: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reminder")

# Send Manual Fee Reminder Email
class ManualEmailRequest(BaseModel):
    player_id: str
    subject: str
    content: str

    # Input validation
    @validator('subject')
    def validate_subject(cls, v):
        if not v or not v.strip():
            raise ValueError('Subject is required')
        if len(v) > 200:
            raise ValueError('Subject must be less than 200 characters')
        return v.strip()

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Email content is required')
        if len(v) > 10000:
            raise ValueError('Content must be less than 10000 characters')
        return v.strip()

@api_router.post("/academy/student-fees/send-manual-reminder")
async def send_manual_fee_reminder(
    email_request: ManualEmailRequest,
    user_info = Depends(require_academy_user)
):
    """
    Send manual custom fee reminder email to student

    Security:
    - Only academy admins can send
    - Subject and content are validated and sanitized
    - Rate limited (checks last 5 minutes)
    - All sends are logged
    """
    try:
        academy_id = user_info["academy_id"]
        admin_id = user_info.get("user_id", "unknown")

        # Rate limiting: Check if admin sent more than 10 emails in last 5 minutes
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        recent_sends = await db.reminder_logs.count_documents({
            "sent_by": admin_id,
            "sent_at": {"$gte": five_minutes_ago}
        })

        if recent_sends >= 10:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please wait before sending more reminders."
            )

        # Get player - SERVER SIDE VALIDATION (ignore any from/to from frontend)
        player = await db.players.find_one({
            "id": email_request.player_id,
            "academy_id": academy_id
        })

        if not player:
            raise HTTPException(status_code=404, detail="Player not found in your academy")

        player_email = player.get("email")
        if not player_email or not player_email.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Player {player.get('name', 'Unknown')} does not have an email address"
            )

        player_name = player.get("name", "Student")

        # Sanitize content (basic HTML sanitization)
        import html
        sanitized_subject = html.escape(email_request.subject)
        # For content, we allow HTML but escape dangerous scripts
        sanitized_content = email_request.content.replace('<script', '&lt;script').replace('</script>', '&lt;/script&gt;')

        # Send email using Zoho SMTP
        logger.info(f"Attempting to send manual email to {player_email} from admin {admin_id}")

        try:
            email_sent = send_manual_email(
                to_email=player_email,
                subject=sanitized_subject,
                content=sanitized_content
            )
        except Exception as email_error:
            logger.error(f"SMTP Error: {str(email_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Email service error: {str(email_error)}"
            )

        if not email_sent:
            raise HTTPException(
                status_code=500,
                detail="Email failed to send. Please check SMTP configuration."
            )

        # Log the manual reminder send
        reminder_log = {
            "id": str(uuid.uuid4()),
            "fee_id": email_request.player_id,  # Using player_id as fee_id for now
            "player_id": email_request.player_id,
            "player_email": player_email,
            "player_name": player_name,
            "academy_id": academy_id,
            "subject": sanitized_subject,
            "type": "MANUAL",
            "sent_at": datetime.utcnow(),
            "sent_by": admin_id,
            "status": "sent"
        }
        await db.reminder_logs.insert_one(reminder_log)

        # Update last_reminder_sent timestamp on fee record
        await db.student_fees.update_one(
            {"player_id": email_request.player_id, "academy_id": academy_id},
            {"$set": {"last_reminder_sent": datetime.utcnow()}},
            upsert=False
        )

        # Create in-app notification for player
        notification = {
            "id": str(uuid.uuid4()),
            "player_id": email_request.player_id,
            "academy_id": academy_id,
            "type": "fee_reminder",
            "title": sanitized_subject,
            "message": sanitized_content[:200],  # First 200 chars
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification)

        logger.info(f"Manual email sent successfully to {player_email} by admin {admin_id}")

        return {
            "success": True,
            "message": "Email sent successfully",
            "recipient": player_email,
            "player_name": player_name,
            "sent_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error sending manual email: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )

# Get Fee Reminder Settings
@api_router.get("/academy/fee-reminder-settings")
async def get_fee_reminder_settings(user_info = Depends(require_academy_user)):
    """Get academy's fee reminder type setting"""
    try:
        academy_id = user_info["academy_id"]

        # Get academy settings
        settings = await db.academy_settings.find_one({"academy_id": academy_id})

        if not settings:
            return {"fee_reminder_type": "manual"}  # Default

        return {
            "fee_reminder_type": settings.get("fee_reminder_type", "manual")
        }

    except Exception as e:
        logger.error(f"Error fetching fee reminder settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

# Get Player Fee Notifications (for player dashboard)
@api_router.get("/player/fee-notifications")
async def get_player_fee_notifications(user_info = Depends(require_player_user)):
    """Get fee notifications for player"""
    try:
        player_id = user_info["player_id"]
        academy_id = user_info["academy_id"]
        
        # Get pending fees
        pending_fees = await db.student_fees.find({
            "player_id": player_id,
            "academy_id": academy_id,
            "status": "pending"
        }).sort("due_date", 1).to_list(10)
        
        # Clean and format
        fee_list = []
        for fee in pending_fees:
            fee.pop("_id", None)
            if fee.get("due_date"):
                fee["due_date"] = fee["due_date"].isoformat()
            if fee.get("created_at"):
                fee["created_at"] = fee["created_at"].isoformat()
            fee_list.append(fee)
        
        # Get fee notifications
        notifications = await db.notifications.find({
            "player_id": player_id,
            "type": {"$in": ["fee_due", "fee_paid", "fee_reminder"]}
        }).sort("created_at", -1).limit(20).to_list(20)
        
        # Clean notifications
        notification_list = []
        for notif in notifications:
            notif.pop("_id", None)
            if notif.get("created_at"):
                notif["created_at"] = notif["created_at"].isoformat()
            notification_list.append(notif)
        
        return {
            "pending_fees": fee_list,
            "notifications": notification_list
        }
        
    except Exception as e:
        logger.error(f"Error fetching fee notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch fee notifications")

# ========== ANNOUNCEMENT MANAGEMENT ENDPOINTS ==========

# Get Academy Announcements (Academy User)
@api_router.get("/academy/announcements")
async def get_academy_announcements(user_info = Depends(require_academy_user)):
    """Get all announcements for the academy"""
    try:
        academy_id = user_info["academy_id"]
        
        announcements = await db.announcements.find(
            {"academy_id": academy_id}
        ).sort("created_at", -1).to_list(100)
        
        return {"announcements": announcements}
        
    except Exception as e:
        logger.error(f"Error fetching academy announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")

# Create Academy Announcement (Academy User)
@api_router.post("/academy/announcements", response_model=Announcement)
async def create_academy_announcement(announcement_data: AnnouncementCreate, user_info = Depends(require_academy_user)):
    """Create a new announcement for the academy"""
    try:
        academy_id = user_info["academy_id"]
        user_id = user_info["user"].id
        
        announcement = Announcement(
            academy_id=academy_id,
            created_by=user_id,
            **announcement_data.dict()
        )
        
        await db.announcements.insert_one(announcement.dict())
        
        return announcement
        
    except Exception as e:
        logger.error(f"Error creating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to create announcement")

# Update Academy Announcement (Academy User)
@api_router.put("/academy/announcements/{announcement_id}", response_model=Announcement)
async def update_academy_announcement(announcement_id: str, announcement_data: AnnouncementUpdate, user_info = Depends(require_academy_user)):
    """Update an academy announcement"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if announcement exists
        existing_announcement = await db.announcements.find_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        if not existing_announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Update announcement
        update_data = announcement_data.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await db.announcements.update_one(
                {"id": announcement_id, "academy_id": academy_id},
                {"$set": update_data}
            )
        
        # Get updated announcement
        updated_announcement = await db.announcements.find_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        return Announcement(**updated_announcement)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to update announcement")

# Delete Academy Announcement (Academy User)
@api_router.delete("/academy/announcements/{announcement_id}")
async def delete_academy_announcement(announcement_id: str, user_info = Depends(require_academy_user)):
    """Delete an academy announcement"""
    try:
        academy_id = user_info["academy_id"]
        
        # Check if announcement exists
        existing_announcement = await db.announcements.find_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        if not existing_announcement:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Delete announcement
        await db.announcements.delete_one({
            "id": announcement_id,
            "academy_id": academy_id
        })
        
        return {"message": "Announcement deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete announcement")

# Include the router in the main app
app.include_router(api_router)
app.include_router(blog_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://track-my-academy.vercel.app",
        "https://dev.trackmyacademy.com",
        "https://www.trackmyacademy.com",
        "https://trackmyacademy.com",
        "https://track-my-academy-backend.onrender.com",
        "https://login-fix-97.preview.emergentagent.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app$",
    # SECURITY FIX MEDIUM #3: Restrict to specific methods and headers instead of wildcard
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Length", "X-Requested-With"],
    max_age=600,
)
