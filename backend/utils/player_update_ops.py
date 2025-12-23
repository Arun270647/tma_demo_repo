from datetime import datetime

def build_player_update_ops(existing_player, player_data, cleaned_update_data=None):
    """
    Build MongoDB update operations for player updates.

    Args:
        existing_player: The current player document from DB
        player_data: The PlayerUpdate Pydantic model
        cleaned_update_data: Optional pre-cleaned update data (with sensitive fields removed)
    """
    # Use cleaned_update_data if provided, otherwise build from player_data
    if cleaned_update_data is not None:
        update_data = cleaned_update_data.copy()
    else:
        update_data = {k: v for k, v in player_data.dict().items() if v is not None}

    update_data["updated_at"] = datetime.utcnow()
    ops = {"$set": update_data}

    # Handle coach_id unassignment (when explicitly set to None)
    fields_set = getattr(player_data, "model_fields_set", set())
    if player_data.coach_id is None and ("coach_id" in fields_set or "coach_id" in getattr(player_data, "__fields_set__", set())):
        if "coach_id" in ops["$set"]:
            ops["$set"].pop("coach_id", None)
        ops["$unset"] = {"coach_id": ""}

    return ops
