from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents.calendar_agent import understand_command
from app.database.connection import get_db
from app.services.nova import execute_intent

router = APIRouter(prefix="/nova", tags=["NOVA"])


class NovaCommand(BaseModel):
    transcript: str = Field(min_length=1, max_length=2000)


@router.post("/command")
def run_command(command: NovaCommand, db: Session = Depends(get_db)):
    try:
        intent = understand_command(command.transcript)
        result = execute_intent(db, intent)
        return {"transcript": command.transcript, "intent": intent.intent, **result}

    except (ValueError, KeyError) as error:
        raise HTTPException(
            status_code=422,
            detail="NOVA couldn't understand that request. Please try again."
        ) from error

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        ) from error

    except Exception as error:
        print("NOVA ERROR:", repr(error))
        raise HTTPException(
            status_code=502,
            detail=f"NOVA could not process that request: {error}"
        ) from error