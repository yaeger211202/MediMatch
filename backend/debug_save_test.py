from backend.app.database import SessionLocal
from backend.app import models
from backend.app.routes import get_or_create_user

payload = {
    'name': 'T',
    'allergies': '',
    'specialists': [],
    'notes': '',
    'diagnoses': [],
    'medications': [
        {
            'name': 'TestMed',
            'dosage': '10 mg',
            'frequency': 'Once daily',
            'time_of_day': 'Morning',
            'start_date': '2026-06-05',
            'stop_date': None,
        }
    ],
}

with SessionLocal() as db:
    try:
        user = get_or_create_user(db)
        user.name = payload['name']
        user.allergies = payload['allergies'] or ""
        user.specialists = ",".join([s.strip() for s in payload['specialists'] if s.strip()])
        user.notes = payload['notes'] or ""
        db.add(user)
        db.flush()
        medications_to_remove = [med.id for med in user.medications] if user.medications else []
        if medications_to_remove:
            db.query(models.MedicationChange).filter(models.MedicationChange.medication_id.in_(medications_to_remove)).delete(synchronize_session=False)
        db.query(models.Medication).filter(models.Medication.user_id == user.id).delete(synchronize_session=False)
        db.query(models.Diagnosis).filter(models.Diagnosis.user_id == user.id).delete(synchronize_session=False)
        db.commit()

        for medication in payload['medications']:
            db.add(
                models.Medication(
                    user_id=user.id,
                    name=medication['name'],
                    dosage=medication['dosage'] or "",
                    frequency=medication['frequency'] or "",
                    time_of_day=medication['time_of_day'] or "",
                    start_date=medication['start_date'],
                    stop_date=medication['stop_date'],
                )
            )
        db.commit()
        print('Success')
    except Exception as e:
        import traceback
        traceback.print_exc()
