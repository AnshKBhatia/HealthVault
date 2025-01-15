// index.ts

import { Context, Contract } from 'fabric-contract-api';
import { Patient, PatientStatus, ConsentStatus } from './models/patientModel';

export class PatientContract extends Contract {

    // Create a new patient record
    async createPatient(ctx: Context, patientData: string): Promise<void> {
        const patient: Patient = JSON.parse(patientData);

        // Check if patient already exists
        const exists = await this.patientExists(ctx, patient.patientId);
        if (exists) {
            throw new Error(`Patient with ID ${patient.patientId} already exists`);
        }

        // Set initial status and timestamp
        patient.status = PatientStatus.ACTIVE;
        patient.lastUpdated = new Date().toISOString();

        await ctx.stub.putState(patient.patientId, Buffer.from(JSON.stringify(patient)));
    }

    // Retrieve a patient by ID
    async getPatient(ctx: Context, patientId: string): Promise<string> {
        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }
        return patientJSON.toString();
    }

    // Update patient information
    async updatePatient(ctx: Context, patientId: string, updatedPatientData: string): Promise<void> {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }

        const updatedPatient: Patient = JSON.parse(updatedPatientData);
        updatedPatient.lastUpdated = new Date().toISOString();

        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(updatedPatient)));
    }

    // Add a medical record to patient history
    async addMedicalRecord(ctx: Context, patientId: string, medicalRecordData: string): Promise<void> {
        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }

        const patient: Patient = JSON.parse(patientJSON.toString());
        const newRecord = JSON.parse(medicalRecordData);

        patient.medicalHistory.push(newRecord);
        patient.lastUpdated = new Date().toISOString();

        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
    }

    // Update consent records
    async updateConsent(ctx: Context, patientId: string, consentData: string): Promise<void> {
        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }

        const patient: Patient = JSON.parse(patientJSON.toString());
        const newConsent = JSON.parse(consentData);

        // Update or add new consent record
        const existingConsentIndex = patient.consent.findIndex(c => c.consentId === newConsent.consentId);
        if (existingConsentIndex >= 0) {
            patient.consent[existingConsentIndex] = newConsent;
        } else {
            patient.consent.push(newConsent);
        }

        patient.lastUpdated = new Date().toISOString();
        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
    }

    // Retrieve patient history
    async getPatientHistory(ctx: Context, patientId: string): Promise<string> {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }

        const historyIterator = await ctx.stub.getHistoryForKey(patientId);
        const history = [];

        try {
            let result = await historyIterator.next();
            while (!result.done) {
                const record = {
                    txId: result.value.txId,
                    timestamp: new Date(result.value.timestamp.seconds.low * 1000).toISOString(),
                    isDelete: result.value.isDelete,
                    value: result.value.value ? JSON.parse(result.value.value.toString()) : null,
                };
                history.push(record);
                result = await historyIterator.next();
            }
        } finally {
            await historyIterator.close();
        }

        return JSON.stringify(history);
    }

    // Helper function to check if patient exists
    async patientExists(ctx: Context, patientId: string): Promise<boolean> {
        const patientJSON = await ctx.stub.getState(patientId);
        return patientJSON && patientJSON.length > 0;
    }

    // Query patients by criteria
    async queryPatients(ctx: Context, queryString: string): Promise<string> {
        const iterator = await ctx.stub.getQueryResult(queryString);
        const results = [];

        try {
            let result = await iterator.next();
            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                results.push(record);
                result = await iterator.next();
            }
        } finally {
            await iterator.close();
        }

        return JSON.stringify(results);
    }
}