"use strict";
// src/blockchain/chaincode/insurance/models/insuranceModel.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceModel = exports.ClaimStatus = exports.PolicyStatus = exports.PolicyType = void 0;
var PolicyType;
(function (PolicyType) {
    PolicyType["HEALTH"] = "HEALTH";
    PolicyType["VEHICLE"] = "VEHICLE";
    PolicyType["LIFE"] = "LIFE";
    PolicyType["PROPERTY"] = "PROPERTY";
})(PolicyType || (exports.PolicyType = PolicyType = {}));
var PolicyStatus;
(function (PolicyStatus) {
    PolicyStatus["ACTIVE"] = "ACTIVE";
    PolicyStatus["EXPIRED"] = "EXPIRED";
    PolicyStatus["CANCELLED"] = "CANCELLED";
    PolicyStatus["PENDING"] = "PENDING";
    PolicyStatus["CLAIMED"] = "CLAIMED";
})(PolicyStatus || (exports.PolicyStatus = PolicyStatus = {}));
var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus["PENDING"] = "PENDING";
    ClaimStatus["APPROVED"] = "APPROVED";
    ClaimStatus["REJECTED"] = "REJECTED";
})(ClaimStatus || (exports.ClaimStatus = ClaimStatus = {}));
class InsuranceModel {
    constructor(data) {
        this.validateRequiredFields(data);
        this.data = Object.assign(Object.assign({}, data), { claims: data.claims || [], createdAt: data.createdAt || new Date().toISOString(), lastUpdated: new Date().toISOString() });
    }
    validateRequiredFields(data) {
        const requiredFields = [
            'policyId',
            'policyHolderName',
            'policyHolderID',
            'policyType',
            'coverageAmount',
            'premium',
            'startDate',
            'endDate'
        ];
        for (let i = 0; i < requiredFields.length; i++) {
            const field = requiredFields[i];
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        this.validateAmounts(data.coverageAmount, data.premium);
        this.validateDates(data.startDate, data.endDate);
        this.validatePolicyType(data.policyType);
    }
    validateAmounts(coverage, premium) {
        if (coverage < InsuranceModel.MINIMUM_COVERAGE) {
            throw new Error(`Coverage amount must be at least ${InsuranceModel.MINIMUM_COVERAGE}`);
        }
        if (premium < InsuranceModel.MINIMUM_PREMIUM) {
            throw new Error(`Premium must be at least ${InsuranceModel.MINIMUM_PREMIUM}`);
        }
        if (premium > coverage) {
            throw new Error('Premium cannot be greater than coverage amount');
        }
    }
    validateDates(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        if (isNaN(start.getTime())) {
            throw new Error('Invalid start date format');
        }
        if (isNaN(end.getTime())) {
            throw new Error('Invalid end date format');
        }
        if (end <= start) {
            throw new Error('End date must be after start date');
        }
        if (start < now && this.data.status === PolicyStatus.PENDING) {
            throw new Error('Start date cannot be in the past for new policies');
        }
    }
    validatePolicyType(type) {
        let validType = false;
        const validTypes = [PolicyType.HEALTH, PolicyType.VEHICLE, PolicyType.LIFE, PolicyType.PROPERTY];
        for (let i = 0; i < validTypes.length; i++) {
            if (validTypes[i] === type) {
                validType = true;
                break;
            }
        }
        if (!validType) {
            throw new Error('Invalid policy type');
        }
    }
    getDetails() {
        return JSON.parse(JSON.stringify(this.data));
    }
    updateStatus(newStatus) {
        if (this.data.status === PolicyStatus.CANCELLED) {
            throw new Error('Cannot update status of cancelled policy');
        }
        if (this.data.status === PolicyStatus.EXPIRED &&
            newStatus !== PolicyStatus.CLAIMED) {
            throw new Error('Expired policy can only be updated to claimed status');
        }
        this.data.status = newStatus;
        this.data.lastUpdated = new Date().toISOString();
    }
    addClaim(claim) {
        if (this.data.status !== PolicyStatus.ACTIVE) {
            throw new Error('Claims can only be added to active policies');
        }
        let totalApprovedClaims = 0;
        for (let i = 0; i < this.data.claims.length; i++) {
            if (this.data.claims[i].status === ClaimStatus.APPROVED) {
                totalApprovedClaims += this.data.claims[i].amount;
            }
        }
        if (totalApprovedClaims + claim.amount > this.data.coverageAmount) {
            throw new Error('Claim amount exceeds remaining coverage');
        }
        const newClaim = Object.assign(Object.assign({}, claim), { claimId: `CLM-${Date.now()}-${this.data.claims.length + 1}`, status: ClaimStatus.PENDING, documents: claim.documents || [] });
        this.data.claims.push(newClaim);
        this.data.lastUpdated = new Date().toISOString();
    }
    updateClaim(claimId, newStatus) {
        let claimFound = false;
        for (let i = 0; i < this.data.claims.length; i++) {
            if (this.data.claims[i].claimId === claimId) {
                if (this.data.claims[i].status !== ClaimStatus.PENDING) {
                    throw new Error('Can only update pending claims');
                }
                this.data.claims[i].status = newStatus;
                claimFound = true;
                break;
            }
        }
        if (!claimFound) {
            throw new Error('Claim not found');
        }
        this.data.lastUpdated = new Date().toISOString();
    }
    getRemainingCoverage() {
        let approvedClaimsTotal = 0;
        for (let i = 0; i < this.data.claims.length; i++) {
            if (this.data.claims[i].status === ClaimStatus.APPROVED) {
                approvedClaimsTotal += this.data.claims[i].amount;
            }
        }
        return Math.max(this.data.coverageAmount - approvedClaimsTotal, 0);
    }
    getRemainingValidity() {
        const currentDate = new Date();
        const endDate = new Date(this.data.endDate);
        const timeDiff = endDate.getTime() - currentDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        return Math.max(daysDiff, 0);
    }
    isExpired() {
        const currentDate = new Date();
        const endDate = new Date(this.data.endDate);
        return currentDate > endDate;
    }
    addDocument(claimId, documentId) {
        let claimFound = false;
        for (let i = 0; i < this.data.claims.length; i++) {
            if (this.data.claims[i].claimId === claimId) {
                this.data.claims[i].documents.push(documentId);
                claimFound = true;
                break;
            }
        }
        if (!claimFound) {
            throw new Error('Claim not found');
        }
        this.data.lastUpdated = new Date().toISOString();
    }
    toJSON() {
        return JSON.stringify(this.data);
    }
}
exports.InsuranceModel = InsuranceModel;
InsuranceModel.MINIMUM_COVERAGE = 1000;
InsuranceModel.MINIMUM_PREMIUM = 100;
