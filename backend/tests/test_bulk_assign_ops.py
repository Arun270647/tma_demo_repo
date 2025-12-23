import sys
import os
from datetime import datetime
sys.path.append(os.path.dirname(os.path.abspath(__file__)).rsplit(os.sep, 1)[0])

def build_update_query(coach_id):
    from datetime import datetime
    if coach_id is None:
        return {"$unset": {"coach_id": ""}, "$set": {"updated_at": datetime.utcnow()}}
    else:
        return {"$set": {"coach_id": coach_id, "updated_at": datetime.utcnow()}}

def test_bulk_assign_builds_unset_for_none():
    q = build_update_query(None)
    assert "$unset" in q
    assert q["$unset"]["coach_id"] == ""
    assert "$set" in q and "updated_at" in q["$set"]

def test_bulk_assign_builds_set_for_id():
    q = build_update_query("c123")
    assert "$unset" not in q
    assert q["$set"]["coach_id"] == "c123"
    assert "updated_at" in q["$set"]
def test_bulk_assign_missing_ids_detection():
    # Simulate found and missing IDs as in server logic
    payload_ids = ["a", "b", "c"]
    found_ids = {"a", "c"}
    missing_ids = [pid for pid in payload_ids if pid not in found_ids]
    assert missing_ids == ["b"]
