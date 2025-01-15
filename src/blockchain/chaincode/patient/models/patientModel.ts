// models/patient.ts

export interface Patient {
    patientId: string;
    personalInfo: PersonalInfo;
    medicalHistory: MedicalRecord[];
    insuranceInfo: InsuranceInfo;
    consent: ConsentRecord[];
    lastUpdated: string;
    status: PatientStatus;
}

export interface PersonalInfo {
    name: string;
    dateOfBirth: string;
    gender: string;
    contactInfo: ContactInfo;
}

export interface ContactInfo {
    phone: string;
    email: string;
    address: string;
}

export interface MedicalRecord {
    recordId: string;
    timestamp: string;
    doctorId: string;
    diagnosis: string;
    treatment: string;
    prescriptions: Prescription[];
    attachments: string[];
    status: MedicalRecordStatus;
    notes?: string;
}

export interface Prescription {
    prescriptionId: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string;
    prescribedBy: string;
    status: PrescriptionStatus;
}

export interface InsuranceInfo {
    policyNumber: string;
    provider: string;
    validUntil: string;
    coverageDetails?: string;
}

export interface ConsentRecord {
    consentId: string;
    granteeName: string;
    granteeId: string;
    accessLevel: AccessLevel;
    validFrom: string;
    validUntil: string;
    purpose: string;
    status: ConsentStatus;
}

export enum PatientStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ARCHIVED = 'ARCHIVED'
}

export enum MedicalRecordStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum PrescriptionStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum AccessLevel {
    READ = 'READ',
    WRITE = 'WRITE',
    FULL = 'FULL'
}

export enum ConsentStatus {
    ACTIVE = 'ACTIVE',
    REVOKED = 'REVOKED',
    EXPIRED = 'EXPIRED'
}