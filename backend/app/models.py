from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    allergies = Column(Text, default="")
    specialists = Column(Text, default="")
    notes = Column(Text, default="")
    diagnoses = relationship("Diagnosis", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    symptoms = relationship("Symptom", back_populates="user", cascade="all, delete-orphan")


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(256), nullable=False)
    details = Column(Text, default="")
    user = relationship("User", back_populates="diagnoses")


class Medication(Base):
    __tablename__ = "medications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(256), nullable=False)
    dosage = Column(String(128), default="")
    frequency = Column(String(128), default="")
    start_date = Column(Date, nullable=True)
    stop_date = Column(Date, nullable=True)
    user = relationship("User", back_populates="medications")
    changes = relationship("MedicationChange", back_populates="medication", cascade="all, delete-orphan")


class MedicationChange(Base):
    __tablename__ = "medication_changes"
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"))
    change_date = Column(Date, nullable=False)
    note = Column(Text, default="")
    medication = relationship("Medication", back_populates="changes")


class Symptom(Base):
    __tablename__ = "symptoms"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(256), nullable=False)
    description = Column(Text, default="")
    user = relationship("User", back_populates="symptoms")
    logs = relationship("SymptomLog", back_populates="symptom", cascade="all, delete-orphan")


class SymptomLog(Base):
    __tablename__ = "symptom_logs"
    id = Column(Integer, primary_key=True, index=True)
    symptom_id = Column(Integer, ForeignKey("symptoms.id", ondelete="CASCADE"))
    logged_on = Column(Date, nullable=False)
    intensity = Column(String(64), default="")
    note = Column(Text, default="")
    symptom = relationship("Symptom", back_populates="logs")


class DoctorQuestion(Base):
    __tablename__ = "doctor_questions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    question = Column(Text, nullable=False)
    created_on = Column(Date, nullable=False)


class AIInsight(Base):
    __tablename__ = "ai_insights"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    summary = Column(Text, default="")
    generated_on = Column(Date, nullable=False)
