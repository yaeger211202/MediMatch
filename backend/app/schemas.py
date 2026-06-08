from datetime import date
from pydantic import BaseModel


class HealthSummary(BaseModel):
    message: str
    disclaimer: str


class DiagnosisBase(BaseModel):
    name: str
    details: str | None = None


class DiagnosisResponse(DiagnosisBase):
    id: int

    model_config = {"from_attributes": True}


class MedicationBase(BaseModel):
    name: str
    dosage: str | None = None
    frequency: str | None = None
    time_of_day: str | None = None
    start_date: date | None = None
    stop_date: date | None = None


class MedicationResponse(MedicationBase):
    id: int

    model_config = {"from_attributes": True}


class UserProfileBase(BaseModel):
    name: str
    allergies: str | None = ""
    specialists: list[str] = []
    notes: str | None = ""


class UserProfileCreate(UserProfileBase):
    diagnoses: list[DiagnosisBase] = []
    medications: list[MedicationBase] = []


class UserProfile(UserProfileBase):
    diagnoses: list[DiagnosisResponse] = []
    medications: list[MedicationResponse] = []

    model_config = {"from_attributes": True}


class SymptomBase(BaseModel):
    name: str
    description: str | None = None


class SymptomResponse(SymptomBase):
    id: int

    model_config = {"from_attributes": True}


class SymptomLogBase(BaseModel):
    symptom_id: int
    logged_on: date
    intensity: str
    note: str | None = None


class SymptomLogResponse(SymptomLogBase):
    id: int
    symptom_name: str

    model_config = {"from_attributes": True}


class MedicationChangeBase(BaseModel):
    medication_id: int
    change_date: date
    note: str | None = None


class MedicationChangeResponse(BaseModel):
    id: int
    medication_id: int
    medication_name: str
    change_date: date
    note: str | None = None

    model_config = {"from_attributes": True}


class DoctorQuestionBase(BaseModel):
    question: str
    created_on: date


class DoctorQuestionResponse(DoctorQuestionBase):
    id: int

    model_config = {"from_attributes": True}


class DoctorQuestionListResponse(BaseModel):
    questions: list[DoctorQuestionResponse] = []
    suggestions: list[str] = []


class AIInsightBase(BaseModel):
    summary: str
    generated_on: date


class AIInsightResponse(AIInsightBase):
    id: int

    model_config = {"from_attributes": True}
