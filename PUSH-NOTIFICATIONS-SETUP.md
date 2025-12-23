# Push Notifications Setup Guide

## 🗄️ Database Schema

### Create `push_subscriptions` Table

Run this SQL in Supabase SQL Editor:

```sql
-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for performance
  CONSTRAINT unique_user_endpoint UNIQUE(user_id, endpoint)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
ON public.push_subscriptions(user_id);

-- Create index on endpoint for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
ON public.push_subscriptions(endpoint);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
```

---

## 📦 Notification Events Table (Optional but Recommended)

Track notification history:

```sql
-- Create notification_events table
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'attendance', 'training_plan', 'message', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_notification_events_user_id
ON public.notification_events(user_id);

-- Create index on type
CREATE INDEX IF NOT EXISTS idx_notification_events_type
ON public.notification_events(type);

-- Enable RLS
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notification events
CREATE POLICY "Users can view own notification events"
ON public.notification_events
FOR SELECT
USING (auth.uid() = user_id);

-- Grant access
GRANT SELECT ON public.notification_events TO authenticated;
GRANT INSERT ON public.notification_events TO service_role;
```

---

## 🚀 Next Steps

1. ✅ Run the SQL scripts in Supabase SQL Editor
2. ✅ Add environment variables to frontend `.env`
3. ✅ Add secrets to Supabase Edge Functions
4. ✅ Deploy the notification components (I'll create these)
5. ✅ Test push notifications

---

## 🔔 Notification Types

The system will send notifications for:

| Event | Title | Description |
|-------|-------|-------------|
| **Attendance Marked** | "Attendance Recorded" | "Your attendance has been marked for [session]" |
| **Training Plan Approved** | "Training Plan Approved ✅" | "Your training plan '[name]' has been approved" |
| **Training Plan Flagged** | "Training Plan Needs Review ⚠️" | "Your training plan '[name]' requires attention" |
| **Player Assigned** | "New Player Assigned 👤" | "[Player] has been assigned to you" |
| **Performance Report** | "New Performance Report 📊" | "Your latest performance report is available" |
| **New Message** | "New Message 💬" | "You have a new message from [sender]" |
| **Goal Achieved** | "Goal Achieved! 🎯" | "Congratulations on reaching your goal: [goal]" |
| **Session Reminder** | "Upcoming Session ⏰" | "Reminder: Session starts in 1 hour" |

---

**Generated:** 2025-12-14
**Security Note:** Never expose the private VAPID key to the frontend!
