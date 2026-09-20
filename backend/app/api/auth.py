import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import UUID

from fastapi import Depends, Header, HTTPException


def get_current_user_id(authorization: str | None = Header(default=None)) -> UUID:
    """Validate the Supabase access token and return the authenticated user's UUID."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")

    token = authorization.removeprefix("Bearer ").strip()
    supabase_url = os.getenv("SUPABASE_URL")
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")

    if not supabase_url or not publishable_key:
        raise HTTPException(
            status_code=503,
            detail="Authentication service is not configured.",
        )

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
    except (HTTPError, URLError, TimeoutError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Invalid or expired session.") from error

    user_id = payload.get("id")
    try:
        return UUID(user_id)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Invalid user identity.") from error
