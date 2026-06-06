from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from . import models, schemas
from .database import get_db

router = APIRouter()


@router.get("/health", response_model=schemas.HealthSummary)
async def health_check():
    return {
        "message": "MediMatch backend is running",
        "disclaimer": "This is educational information only and not medical advice. Never replace medical professionals."
    }


def get_or_create_user(db: Session, user_id: int = 1) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        user = models.User(id=user_id, name="MediMatch User", allergies="", specialists="", notes="")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/profile", response_model=schemas.UserProfile)
async def read_profile(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    return schemas.UserProfile(
        name=user.name,
        allergies=user.allergies,
        specialists=[s.strip() for s in user.specialists.split(",") if s.strip()],
        notes=user.notes,
        diagnoses=user.diagnoses,
        medications=user.medications,
    )


@router.post("/profile", response_model=schemas.UserProfile)
async def update_profile(profile: schemas.UserProfileCreate, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    user.name = profile.name
    user.allergies = profile.allergies or ""
    user.specialists = ",".join([s.strip() for s in profile.specialists if s.strip()])
    user.notes = profile.notes or ""
    db.add(user)
    db.flush()
    medications_to_remove = [med.id for med in user.medications] if user.medications else []
    if medications_to_remove:
        db.query(models.MedicationChange).filter(models.MedicationChange.medication_id.in_(medications_to_remove)).delete(synchronize_session=False)
    db.query(models.Medication).filter(models.Medication.user_id == user.id).delete(synchronize_session=False)
    db.query(models.Diagnosis).filter(models.Diagnosis.user_id == user.id).delete(synchronize_session=False)
    db.commit()

    for diagnosis in profile.diagnoses:
        db.add(
            models.Diagnosis(
                user_id=user.id,
                name=diagnosis.name,
                details=diagnosis.details or "",
            )
        )

    for medication in profile.medications:
        db.add(
            models.Medication(
                user_id=user.id,
                name=medication.name,
                dosage=medication.dosage or "",
                frequency=medication.frequency or "",
                start_date=medication.start_date,
                stop_date=medication.stop_date,
            )
        )

    db.commit()
    db.refresh(user)
    return schemas.UserProfile(
        name=user.name,
        allergies=user.allergies,
        specialists=[s.strip() for s in user.specialists.split(",") if s.strip()],
        notes=user.notes,
        diagnoses=user.diagnoses,
        medications=user.medications,
    )


@router.get("/timeline", response_model=list[schemas.MedicationChangeResponse])
async def read_timeline(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    changes = (
        db.query(models.MedicationChange)
        .join(models.Medication)
        .filter(models.Medication.user_id == user.id)
        .order_by(models.MedicationChange.change_date.desc())
        .all()
    )
    return [
        schemas.MedicationChangeResponse(
            id=change.id,
            medication_id=change.medication_id,
            medication_name=change.medication.name,
            change_date=change.change_date,
            note=change.note,
        )
        for change in changes
    ]


@router.post("/timeline", response_model=schemas.MedicationChangeResponse)
async def create_timeline_change(change: schemas.MedicationChangeBase, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    medication = db.query(models.Medication).filter(models.Medication.id == change.medication_id, models.Medication.user_id == user.id).first()
    if not medication:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Invalid medication selected")

    change_record = models.MedicationChange(
        medication_id=medication.id,
        change_date=change.change_date,
        note=change.note or "",
    )
    db.add(change_record)
    db.commit()
    db.refresh(change_record)
    return schemas.MedicationChangeResponse(
        id=change_record.id,
        medication_id=change_record.medication_id,
        medication_name=medication.name,
        change_date=change_record.change_date,
        note=change_record.note,
    )


@router.get("/symptoms", response_model=list[schemas.SymptomResponse])
async def read_symptoms(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    return user.symptoms


@router.post("/symptoms", response_model=schemas.SymptomResponse)
async def create_symptom(symptom: schemas.SymptomBase, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    symptom_record = models.Symptom(
        user_id=user.id,
        name=symptom.name,
        description=symptom.description or "",
    )
    db.add(symptom_record)
    db.commit()
    db.refresh(symptom_record)
    return symptom_record


@router.get("/symptom-logs", response_model=list[schemas.SymptomLogResponse])
async def read_symptom_logs(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    logs = (
        db.query(models.SymptomLog)
        .join(models.Symptom)
        .filter(models.Symptom.user_id == user.id)
        .order_by(models.SymptomLog.logged_on.desc())
        .all()
    )
    return [
        schemas.SymptomLogResponse(
            id=log.id,
            symptom_id=log.symptom_id,
            symptom_name=log.symptom.name,
            logged_on=log.logged_on,
            intensity=log.intensity,
            note=log.note,
        )
        for log in logs
    ]


@router.post("/symptom-logs", response_model=schemas.SymptomLogResponse)
async def create_symptom_log(log: schemas.SymptomLogBase, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    symptom = (
        db.query(models.Symptom)
        .filter(models.Symptom.id == log.symptom_id, models.Symptom.user_id == user.id)
        .first()
    )
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom not found")

    symptom_log = models.SymptomLog(
        symptom_id=log.symptom_id,
        logged_on=log.logged_on,
        intensity=log.intensity,
        note=log.note or "",
    )
    db.add(symptom_log)
    db.commit()
    db.refresh(symptom_log)
    return schemas.SymptomLogResponse(
        id=symptom_log.id,
        symptom_id=symptom_log.symptom_id,
        symptom_name=symptom.name,
        logged_on=symptom_log.logged_on,
        intensity=symptom_log.intensity,
        note=symptom_log.note,
    )
