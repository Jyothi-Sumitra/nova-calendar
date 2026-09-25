import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import UUID

from fastapi import Depends, Header, HTTPException

LOCAL_DEV_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


def get_current_user_id(authorization: str | None = Header(default=None)) -> UUID:
    """Validate the Supabase access token and return the authenticated user's UUID.
    Falls back to a default local user ID when Supabase authentication is not configured.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")

    if not supabase_url or not publishable_key:
        return LOCAL_DEV_USER_ID

    if not authorization or not authorization.startswith("Bearer "):
        return LOCAL_DEV_USER_ID

    token = authorization.removeprefix("Bearer ").strip()
    if not token or token in {"null", "undefined", "none"}:
        return LOCAL_DEV_USER_ID

    request = Request(
        f"{supabase_url.rstrip('/')}/auth/v1/user",
        headers={
            "apikey": publishable_key,
            "Authorization": f"Bearer {token}",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
        user_id = payload.get("id")
        if user_id:
            return UUID(user_id)
        return LOCAL_DEV_USER_ID
    except Exception:
        # Fall back to default user ID if token check fails (e.g. guest session)
        return LOCAL_DEV_USER_ID
