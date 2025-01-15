"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
class PatientContract extends fabric_contract_api_1.Contract {
    initLedger(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('========= Initialize Patient Ledger ===========');
        });
    }
    // Create a new patient record
    createPatient(ctx, patientId, patientData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('========= START : Create Patient ===========');
            const exists = yield ctx.stub.getState(patientId);
            if (exists && exists.length > 0) {
                throw new Error(`Patient ${patientId} already exists`);
            }
            const patient = JSON.parse(patientData);
            patient.lastUpdated = new Date().toISOString();
            yield ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
        });
    }
    // Get patient record
    getPatient(ctx, patientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const patientAsBytes = yield ctx.stub.getState(patientId);
            if (!patientAsBytes || patientAsBytes.length === 0) {
                throw new Error(`Patient ${patientId} does not exist`);
            }
            return patientAsBytes.toString();
        });
    }
    // Add medical record to patient
    addMedicalRecord(ctx, patientId, recordData) {
        return __awaiter(this, void 0, void 0, function* () {
            const patientAsBytes = yield ctx.stub.getState(patientId);
            if (!patientAsBytes || patientAsBytes.length === 0) {
                throw new Error(`Patient ${patientId} does not exist`);
            }
            const patient = JSON.parse(patientAsBytes.toString());
            const newRecord = JSON.parse(recordData);
            patient.medicalHistory.push(newRecord);
            patient.lastUpdated = new Date().toISOString();
            yield ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
        });
    }
    // Grant consent
    grantConsent(ctx, patientId, consentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const patientAsBytes = yield ctx.stub.getState(patientId);
            if (!patientAsBytes || patientAsBytes.length === 0) {
                throw new Error(`Patient ${patientId} does not exist`);
            }
            const patient = JSON.parse(patientAsBytes.toString());
            const consent = JSON.parse(consentData);
            patient.consent.push(consent);
            patient.lastUpdated = new Date().toISOString();
            yield ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
        });
    }
    // Revoke consent
    revokeConsent(ctx, patientId, consentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const patientAsBytes = yield ctx.stub.getState(patientId);
            if (!patientAsBytes || patientAsBytes.length === 0) {
                throw new Error(`Patient ${patientId} does not exist`);
            }
            const patient = JSON.parse(patientAsBytes.toString());
            const consentIndex = patient.consent.findIndex(c => c.consentId === consentId);
            if (consentIndex === -1) {
                throw new Error(`Consent ${consentId} not found`);
            }
            patient.consent[consentIndex].status = 'REVOKED';
            patient.lastUpdated = new Date().toISOString();
            yield ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
        });
    }
    // Update patient information
    updatePatient(ctx, patientId, patientData) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield ctx.stub.getState(patientId);
            if (!exists || exists.length === 0) {
                throw new Error(`Patient ${patientId} does not exist`);
            }
            const updatedPatient = JSON.parse(patientData);
            updatedPatient.lastUpdated = new Date().toISOString();
            yield ctx.stub.putState(patientId, Buffer.from(JSON.stringify(updatedPatient)));
        });
    }
    // Query patient history
    getPatientHistory(ctx, patientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const iterator = yield ctx.stub.getHistoryForKey(patientId);
            const results = [];
            let result = yield iterator.next();
            while (!result.done) {
                const modification = {
                    txId: result.value.txId,
                    value: JSON.parse(result.value.value.toString('utf8')),
                    timestamp: result.value.timestamp,
                    isDelete: result.value.isDelete
                };
                results.push(modification);
                result = yield iterator.next();
            }
            return JSON.stringify(results);
        });
    }
}
exports.PatientContract = PatientContract;
exports.default = PatientContract;
