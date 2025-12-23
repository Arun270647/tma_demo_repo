"""
Blog Microservice API
Private internal blog automation system with public read-only blogs page.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from supabase import Client
import os
import uuid
import logging

logger = logging.getLogger(__name__)

# Create blog router
blog_router = APIRouter(prefix="/api/blog", tags=["blog"])
security = HTTPBearer(auto_error=False)

# Global references - will be set by setup_blog_dependencies()
_db: AsyncIOMotorClient = None
_supabase: Client = None
_supabase_admin: Client = None

def setup_blog_dependencies(db: AsyncIOMotorClient, supabase: Client, supabase_admin: Client = None):
    """Set up database and Supabase clients for blog router"""
    global _db, _supabase, _supabase_admin
    _db = db
    _supabase = supabase
    _supabase_admin = supabase_admin or supabase

# ============================================================================
# BLOG MODELS
# ============================================================================

class BlogWriter(BaseModel):
    """Blog writer profile"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supabase_user_id: str
    name: str
    email: EmailStr
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None
    role: str = "writer"  # writer or admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class BlogWriterCreate(BaseModel):
    """Create new blog writer (admin only)"""
    email: EmailStr
    name: str
    bio: Optional[str] = None
    password: str  # Will be used to create Supabase account


class BlogWriterUpdate(BaseModel):
    """Update writer profile"""
    name: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None


class BlogPost(BaseModel):
    """Blog post model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str  # URL-friendly version of title
    content: str  # Markdown content
    excerpt: Optional[str] = None  # Short summary
    author_id: str
    author_name: str  # Cached for performance
    status: str = "draft"  # draft, pending, approved, rejected
    tags: List[str] = []
    cover_image_url: Optional[str] = None
    read_time_minutes: Optional[int] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    submitted_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    views_count: int = 0


class BlogPostCreate(BaseModel):
    """Create new blog post (writer)"""
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    tags: List[str] = []
    cover_image_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: List[str] = []


class BlogPostUpdate(BaseModel):
    """Update existing blog post (writer, only drafts)"""
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[List[str]] = None


class BlogFeedback(BaseModel):
    """Admin feedback on rejected blog"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    blog_id: str
    admin_id: str
    admin_name: str
    comment: str
    rating: int = Field(ge=1, le=10)  # 1-10 rating
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BlogFeedbackCreate(BaseModel):
    """Create feedback (admin only)"""
    blog_id: str
    comment: str
    rating: int = Field(ge=1, le=10)


class BlogApprovalAction(BaseModel):
    """Admin approval/rejection action"""
    action: str  # "approve" or "reject"
    comment: Optional[str] = None  # Required for rejection
    rating: Optional[int] = Field(None, ge=1, le=10)  # Required for rejection


# ============================================================================
# AUTHENTICATION HELPERS
# ============================================================================

async def get_current_blog_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current authenticated blog user (writer or admin)
    Verifies JWT token and checks if user has blog access
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify JWT token with Supabase
        user_response = _supabase.auth.get_user(credentials.credentials)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        supabase_user = user_response.user

        # Check if user exists in blog_writers collection
        writer = await _db.blog_writers.find_one({
            "supabase_user_id": supabase_user.id,
            "is_active": True
        })

        if not writer:
            raise HTTPException(
                status_code=403,
                detail="User does not have blog system access"
            )

        return {
            "supabase_id": supabase_user.id,
            "writer_id": writer["id"],
            "email": writer["email"],
            "name": writer["name"],
            "role": writer["role"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Blog authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def require_admin(current_user: Dict = Depends(get_current_blog_user)) -> Dict:
    """Require admin role"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user


# ============================================================================
# WRITER MANAGEMENT ENDPOINTS (Admin only)
# ============================================================================

@blog_router.post("/writers", response_model=BlogWriter)
async def create_writer(
    writer_data: BlogWriterCreate,
    current_user: Dict = Depends(require_admin)
):
    """Create new blog writer (admin only)"""
    try:
        # Create Supabase user
        auth_response = _supabase_admin.auth.admin.create_user({
            "email": writer_data.email,
            "password": writer_data.password,
            "email_confirm": True,
            "user_metadata": {
                "name": writer_data.name,
                "role": "blog_writer"
            }
        })

        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=400, detail="Failed to create user account")

        # Create writer document in MongoDB
        writer = BlogWriter(
            supabase_user_id=auth_response.user.id,
            name=writer_data.name,
            email=writer_data.email,
            bio=writer_data.bio,
            role="writer"
        )

        await _db.blog_writers.insert_one(writer.model_dump())

        return writer

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating writer: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create writer: {str(e)}")


@blog_router.get("/writers", response_model=List[BlogWriter])
async def list_writers(
    current_user: Dict = Depends(require_admin),
    include_inactive: bool = False
):
    """List all blog writers (admin only)"""
    query = {} if include_inactive else {"is_active": True}
    writers = await _db.blog_writers.find(query).to_list(length=100)
    return writers


@blog_router.patch("/writers/{writer_id}", response_model=BlogWriter)
async def update_writer(
    writer_id: str,
    update_data: BlogWriterUpdate,
    current_user: Dict = Depends(require_admin),
):
    """Update writer profile (admin only)"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await _db.blog_writers.find_one_and_update(
        {"id": writer_id},
        {"$set": update_dict},
        return_document=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="Writer not found")

    return result


# ============================================================================
# BLOG POST ENDPOINTS (Writer)
# ============================================================================

@blog_router.post("/posts", response_model=BlogPost)
async def create_blog_post(
    post_data: BlogPostCreate,
    current_user: Dict = Depends(get_current_blog_user),
):
    """Create new blog post (writer)"""
    # Check for duplicate slug
    existing = await _db.blog_posts.find_one({"slug": post_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")

    post = BlogPost(
        **post_data.model_dump(),
        author_id=current_user["writer_id"],
        author_name=current_user["name"],
        status="draft"
    )

    await _db.blog_posts.insert_one(post.model_dump())

    return post


@blog_router.get("/posts/my", response_model=List[BlogPost])
async def get_my_posts(
    current_user: Dict = Depends(get_current_blog_user),
):
    """Get current user's blog posts"""
    posts = await _db.blog_posts.find({
        "author_id": current_user["writer_id"]
    }).sort("created_at", -1).to_list(length=100)

    return posts


@blog_router.get("/posts/{post_id}", response_model=BlogPost)
async def get_blog_post(
    post_id: str,
    current_user: Dict = Depends(get_current_blog_user),
):
    """Get specific blog post"""
    post = await _db.blog_posts.find_one({"id": post_id})

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Writers can only see their own posts, admins can see all
    if current_user["role"] != "admin" and post["author_id"] != current_user["writer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return post


@blog_router.patch("/posts/{post_id}", response_model=BlogPost)
async def update_blog_post(
    post_id: str,
    update_data: BlogPostUpdate,
    current_user: Dict = Depends(get_current_blog_user),
):
    """Update blog post (only drafts can be edited)"""
    post = await _db.blog_posts.find_one({"id": post_id})

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Only author can edit their own posts
    if post["author_id"] != current_user["writer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Only drafts can be edited
    if post["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit {post['status']} posts. Only drafts can be modified."
        )

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    result = await _db.blog_posts.find_one_and_update(
        {"id": post_id},
        {"$set": update_dict},
        return_document=True
    )

    return result


@blog_router.post("/posts/{post_id}/submit")
async def submit_for_approval(
    post_id: str,
    current_user: Dict = Depends(get_current_blog_user),
):
    """Submit blog post for admin approval"""
    post = await _db.blog_posts.find_one({"id": post_id})

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    if post["author_id"] != current_user["writer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if post["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft posts can be submitted"
        )

    result = await _db.blog_posts.find_one_and_update(
        {"id": post_id},
        {"$set": {
            "status": "pending",
            "submitted_at": datetime.utcnow()
        }},
        return_document=True
    )

    return {"message": "Blog post submitted for approval", "post": result}


@blog_router.delete("/posts/{post_id}")
async def delete_blog_post(
    post_id: str,
    current_user: Dict = Depends(get_current_blog_user),
):
    """Delete blog post (only drafts)"""
    post = await _db.blog_posts.find_one({"id": post_id})

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    if post["author_id"] != current_user["writer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if post["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft posts can be deleted"
        )

    await _db.blog_posts.delete_one({"id": post_id})

    return {"message": "Blog post deleted successfully"}


# ============================================================================
# ADMIN REVIEW ENDPOINTS
# ============================================================================

@blog_router.get("/admin/posts/pending", response_model=List[BlogPost])
async def get_pending_posts(
    current_user: Dict = Depends(require_admin),
):
    """Get all pending blog posts (admin only)"""
    posts = await _db.blog_posts.find({
        "status": "pending"
    }).sort("submitted_at", 1).to_list(length=100)

    return posts


@blog_router.get("/admin/posts", response_model=List[BlogPost])
async def get_all_posts(
    current_user: Dict = Depends(require_admin),
    status: Optional[str] = None
):
    """Get all blog posts with optional status filter (admin only)"""
    query = {"status": status} if status else {}
    posts = await _db.blog_posts.find(query).sort("created_at", -1).to_list(length=200)

    return posts


@blog_router.post("/admin/posts/{post_id}/review")
async def review_blog_post(
    post_id: str,
    action: BlogApprovalAction,
    current_user: Dict = Depends(require_admin),
):
    """Approve or reject blog post (admin only)"""
    post = await _db.blog_posts.find_one({"id": post_id})

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    if post["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending posts can be reviewed"
        )

    if action.action == "approve":
        # Approve the blog post
        result = await _db.blog_posts.find_one_and_update(
            {"id": post_id},
            {"$set": {
                "status": "approved",
                "published_at": datetime.utcnow()
            }},
            return_document=True
        )

        # TODO: Trigger static file generation

        return {"message": "Blog post approved and published", "post": result}

    elif action.action == "reject":
        # Validation for rejection
        if not action.comment or not action.rating:
            raise HTTPException(
                status_code=400,
                detail="Comment and rating are required for rejection"
            )

        # Reject the blog post
        result = await _db.blog_posts.find_one_and_update(
            {"id": post_id},
            {"$set": {"status": "rejected"}},
            return_document=True
        )

        # Create feedback
        feedback = BlogFeedback(
            blog_id=post_id,
            admin_id=current_user["writer_id"],
            admin_name=current_user["name"],
            comment=action.comment,
            rating=action.rating
        )

        await _db.blog_feedback.insert_one(feedback.model_dump())

        return {
            "message": "Blog post rejected with feedback",
            "post": result,
            "feedback": feedback
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid action")


# ============================================================================
# FEEDBACK ENDPOINTS
# ============================================================================

@blog_router.get("/posts/{post_id}/feedback", response_model=List[BlogFeedback])
async def get_post_feedback(
    post_id: str,
    current_user: Dict = Depends(get_current_blog_user),
):
    """Get feedback for a rejected blog post"""
    # Verify post belongs to current user or user is admin
    post = await _db.blog_posts.find_one({"id": post_id})

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    if current_user["role"] != "admin" and post["author_id"] != current_user["writer_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    feedback = await _db.blog_feedback.find({
        "blog_id": post_id
    }).sort("created_at", -1).to_list(length=10)

    return feedback


# ============================================================================
# PUBLIC ENDPOINTS (No auth required)
# ============================================================================

@blog_router.get("/public/posts", response_model=List[Dict[str, Any]])
async def get_published_posts(
    limit: int = 20,
    skip: int = 0
):
    """Get published blog posts for public display"""
    posts = await _db.blog_posts.find({
        "status": "approved"
    }).sort("published_at", -1).skip(skip).limit(limit).to_list(length=limit)

    # Return minimal data for public consumption
    return [
        {
            "id": post["id"],
            "title": post["title"],
            "slug": post["slug"],
            "excerpt": post.get("excerpt", ""),
            "author_name": post["author_name"],
            "published_at": post.get("published_at"),
            "cover_image_url": post.get("cover_image_url"),
            "tags": post.get("tags", []),
            "read_time_minutes": post.get("read_time_minutes"),
        }
        for post in posts
    ]


@blog_router.get("/public/posts/{slug}", response_model=Dict[str, Any])
async def get_published_post_by_slug(
    slug: str,
):
    """Get single published blog post by slug"""
    post = await _db.blog_posts.find_one({
        "slug": slug,
        "status": "approved"
    })

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Increment view count
    await _db.blog_posts.update_one(
        {"id": post["id"]},
        {"$inc": {"views_count": 1}}
    )

    return {
        "id": post["id"],
        "title": post["title"],
        "slug": post["slug"],
        "content": post["content"],
        "excerpt": post.get("excerpt", ""),
        "author_name": post["author_name"],
        "published_at": post.get("published_at"),
        "cover_image_url": post.get("cover_image_url"),
        "tags": post.get("tags", []),
        "read_time_minutes": post.get("read_time_minutes"),
        "seo_title": post.get("seo_title"),
        "seo_description": post.get("seo_description"),
        "seo_keywords": post.get("seo_keywords", []),
        "views_count": post.get("views_count", 0)
    }


# ============================================================================
# PROFILE PHOTO UPLOAD
# ============================================================================

@blog_router.post("/writers/upload-photo")
async def upload_writer_photo(
    file: UploadFile = File(...),
    current_user: Dict = Depends(get_current_blog_user),
):
    """Upload writer profile photo"""
    # TODO: Implement file upload to storage (S3, Cloudinary, etc.)
    # For now, return placeholder
    raise HTTPException(status_code=501, detail="Photo upload not yet implemented")


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title"""
    import re
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = slug.strip('-')
    return slug


# ============================================================================
# DEBUG ENDPOINT - Remove after fixing
# ============================================================================

@blog_router.get("/debug/check-user")
async def debug_check_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Debug endpoint to check user authentication and MongoDB lookup"""
    if not credentials:
        return {"error": "No credentials provided"}

    try:
        # Step 1: Verify Supabase token
        user_response = _supabase.auth.get_user(credentials.credentials)
        if not user_response or not user_response.user:
            return {"error": "Invalid Supabase token", "step": 1}

        supabase_user = user_response.user
        supabase_user_id = supabase_user.id

        # Step 2: Look up in MongoDB
        writer = await _db.blog_writers.find_one({
            "supabase_user_id": supabase_user_id
        })

        # Step 3: Look up with is_active filter
        active_writer = await _db.blog_writers.find_one({
            "supabase_user_id": supabase_user_id,
            "is_active": True
        })

        # Step 4: Count all writers
        total_writers = await _db.blog_writers.count_documents({})

        # Step 5: Get all writers for comparison
        all_writers = await _db.blog_writers.find().to_list(length=10)

        return {
            "step_1_supabase_auth": "SUCCESS",
            "supabase_user_id": supabase_user_id,
            "supabase_user_email": supabase_user.email,
            "step_2_mongodb_lookup": "FOUND" if writer else "NOT_FOUND",
            "writer_data": {
                "email": writer.get("email") if writer else None,
                "role": writer.get("role") if writer else None,
                "is_active": writer.get("is_active") if writer else None,
                "supabase_user_id_in_db": writer.get("supabase_user_id") if writer else None
            } if writer else None,
            "step_3_active_lookup": "FOUND" if active_writer else "NOT_FOUND",
            "total_writers_in_db": total_writers,
            "all_writers_emails": [w.get("email") for w in all_writers],
            "all_writers_supabase_ids": [w.get("supabase_user_id") for w in all_writers]
        }
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }
