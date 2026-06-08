from datetime import date
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


def generate_doctor_question_suggestions(user: models.User, logs: list[models.SymptomLog]) -> list[str]:
    suggestions: list[str] = []

    if user.medications:
        medication_names = ", ".join([med.name for med in user.medications if med.name])
        suggestions.append(
            f"Review your current medications with your provider, especially {medication_names}. Ask about any side effects or adjustments."
        )
    else:
        suggestions.append(
            "Share your current prescription and over-the-counter medication list to help your provider understand your care plan."
        )

    if user.allergies:
        suggestions.append(
            "Describe any known allergies or sensitivities so your provider can avoid medicines that may cause a reaction."
        )

    if logs:
        severe_logs = [log for log in logs if log.intensity.lower() in ("high", "severe")]
        if severe_logs:
            suggestions.append(
                "Ask whether your symptoms are linked to current medication timing, dose changes, or known triggers."
            )
        else:
            suggestions.append(
                "Tell your provider how often symptoms occur and whether they are improving, stable, or fluctuating."
            )

    if user.specialists:
        specialists_text = ", ".join([s.strip() for s in user.specialists.split(",") if s.strip()])
        suggestions.append(
            f"Mention the specialists you see, such as {specialists_text}, so your provider can coordinate care more effectively."
        )

    if not suggestions:
        suggestions.append(
            "Share your health goals and any recent changes in how you feel during your visit."
        )

    return suggestions[:5]


def generate_ai_insight_summary(user: models.User, logs: list[models.SymptomLog]) -> str:
    lines: list[str] = [
        "This summary is educational only and not medical advice."
    ]

    if user.diagnoses:
        diagnosis_names = ", ".join([diagnosis.name for diagnosis in user.diagnoses if diagnosis.name])
        lines.append(
            f"You are tracking {len(user.diagnoses)} diagnosis(es), including {diagnosis_names}."
        )
    else:
        lines.append("No diagnosis details are recorded yet.")

    if user.medications:
        medication_names = ", ".join([med.name for med in user.medications if med.name])
        lines.append(
            f"You are tracking {len(user.medications)} medication(s): {medication_names}."
        )
    else:
        lines.append("No medications are recorded yet.")

    if logs:
        severe_count = sum(1 for log in logs if log.intensity.lower() in ("high", "severe"))
        if severe_count:
            lines.append(
                "Some recent symptom entries report higher intensity. Notice patterns in timing, triggers, and medication changes."
            )
        else:
            lines.append(
                "Recent symptom entries show moderate or lower intensity levels, but consistent journaling can still reveal helpful trends."
            )
    else:
        lines.append(
            "No symptom logs were found. Recording symptoms regularly can help identify patterns for future visits."
        )

    if user.allergies:
        lines.append(
            "Share your allergy and sensitivity history with your care team so they can select safer treatment options."
        )

    specialists_list = [s.strip() for s in user.specialists.split(",") if s.strip()]
    if specialists_list:
        lines.append(
            f"Your care team includes specialists such as {', '.join(specialists_list)}. Coordinating those details may help improve communication."
        )

    lines.append(
        "Use this educational summary to support conversations with providers rather than to guide medical decisions."
    )
    return " ".join(lines)


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
    ).model_dump()


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
                time_of_day=medication.time_of_day or "",
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
    ).model_dump()


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


@router.get("/doctor-questions", response_model=schemas.DoctorQuestionListResponse)
async def read_doctor_questions(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    saved_questions = (
        db.query(models.DoctorQuestion)
        .filter(models.DoctorQuestion.user_id == user.id)
        .order_by(models.DoctorQuestion.created_on.desc())
        .all()
    )
    logs = (
        db.query(models.SymptomLog)
        .join(models.Symptom)
        .filter(models.Symptom.user_id == user.id)
        .all()
    )
    suggestions = generate_doctor_question_suggestions(user, logs)
    return {"questions": saved_questions, "suggestions": suggestions}


@router.post("/doctor-questions", response_model=schemas.DoctorQuestionResponse)
async def create_doctor_question(question_data: schemas.DoctorQuestionBase, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    question_record = models.DoctorQuestion(
        user_id=user.id,
        question=question_data.question,
        created_on=question_data.created_on,
    )
    db.add(question_record)
    db.commit()
    db.refresh(question_record)
    return question_record


@router.get("/ai-insights", response_model=list[schemas.AIInsightResponse])
async def read_ai_insights(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    insights = (
        db.query(models.AIInsight)
        .filter(models.AIInsight.user_id == user.id)
        .order_by(models.AIInsight.generated_on.desc())
        .all()
    )
    return insights


@router.post("/ai-insights", response_model=schemas.AIInsightResponse)
async def create_ai_insight(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    logs = (
        db.query(models.SymptomLog)
        .join(models.Symptom)
        .filter(models.Symptom.user_id == user.id)
        .all()
    )
    summary = generate_ai_insight_summary(user, logs)
    insight = models.AIInsight(
        user_id=user.id,
        summary=summary,
        generated_on=date.today(),
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight
