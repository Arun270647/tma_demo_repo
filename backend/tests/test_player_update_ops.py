import pytest
import sys
import os
from datetime import datetime
sys.path.append(os.path.dirname(os.path.abspath(__file__)).rsplit(os.sep, 1)[0])
from utils.player_update_ops import build_player_update_ops
from pydantic import BaseModel
from typing import Optional

class PlayerUpdate(BaseModel):
    first_name: Optional[str] = None
    coach_id: Optional[str] = None

def test_unassign_builds_unset():
    existing = {"id": "p1", "coach_id": "c1"}
    payload = PlayerUpdate(coach_id=None)
    ops = build_player_update_ops(existing, payload)
    assert "$unset" in ops
    assert ops["$unset"].get("coach_id") == ""
    assert "$set" in ops
    assert "updated_at" in ops["$set"]

def test_assign_builds_set():
    existing = {"id": "p1", "coach_id": None}
    payload = PlayerUpdate(coach_id="c2")
    ops = build_player_update_ops(existing, payload)
    assert "$unset" not in ops
    assert ops["$set"].get("coach_id") == "c2"

def test_no_coach_field_keeps_assignment():
    existing = {"id": "p1", "coach_id": "c1"}
    payload = PlayerUpdate(first_name="John")
    ops = build_player_update_ops(existing, payload)
    assert "$unset" not in ops
    assert "coach_id" not in ops["$set"]
    assert ops["$set"].get("first_name") == "John"
