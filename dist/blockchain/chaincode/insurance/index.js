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
exports.InsuranceContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
const insuranceModel_1 = require("./models/insuranceModel");
class InsuranceContract extends fabric_contract_api_1.Contract {
    // Initialize Ledger
    initLedger(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Initialize Insurance Ledger ===========');
            // Initialization logic if needed
            console.info('============= END : Initialize Insurance Ledger ===========');
        });
    }
    // Create a new Insurance Policy
    createInsurancePolicy(ctx, policyId, policyData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Create Insurance Policy ===========');
            const exists = yield ctx.stub.getState(policyId);
            if (exists && exists.length > 0) {
                throw new Error(`Policy ${policyId} already exists`);
            }
            try {
                const insuranceData = JSON.parse(policyData);
                const insurancePolicy = new insuranceModel_1.InsuranceModel(insuranceData);
                yield ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
            }
            catch (error) {
                // @ts-ignore
                throw new Error(`Error creating insurance policy: ${error.message}`);
            }
            console.info('============= END : Create Insurance Policy ===========');
        });
    }
    // Retrieve an Insurance Policy by its ID
    getInsurancePolicy(ctx, policyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const policyAsBytes = yield ctx.stub.getState(policyId);
            if (!policyAsBytes || policyAsBytes.length === 0) {
                throw new Error(`Policy ${policyId} does not exist`);
            }
            return policyAsBytes.toString();
        });
    }
    // Update the Status of an Insurance Policy
    updatePolicyStatus(ctx, policyId, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Update Policy Status ===========');
            const policyAsBytes = yield ctx.stub.getState(policyId);
            if (!policyAsBytes || policyAsBytes.length === 0) {
                throw new Error(`Policy ${policyId} does not exist`);
            }
            try {
                const insurancePolicy = new insuranceModel_1.InsuranceModel(JSON.parse(policyAsBytes.toString()));
                insurancePolicy.updateStatus(newStatus);
                yield ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
            }
            catch (error) {
                // @ts-ignore
                throw new Error(`Error updating policy status: ${error.message}`);
            }
            console.info('============= END : Update Policy Status ===========');
        });
    }
    // Submit a Claim for an Insurance Policy
    submitClaim(ctx, policyId, claimData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Submit Claim ===========');
            const policyAsBytes = yield ctx.stub.getState(policyId);
            if (!policyAsBytes || policyAsBytes.length === 0) {
                throw new Error(`Policy ${policyId} does not exist`);
            }
            try {
                const insurancePolicy = new insuranceModel_1.InsuranceModel(JSON.parse(policyAsBytes.toString()));
                insurancePolicy.addClaim(JSON.parse(claimData));
                yield ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
            }
            catch (error) {
                // @ts-ignore
                throw new Error(`Error submitting claim: ${error.message}`);
            }
            console.info('============= END : Submit Claim ===========');
        });
    }
    // Update the Status of a Claim
    updateClaimStatus(ctx, policyId, claimId, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Update Claim Status ===========');
            const policyAsBytes = yield ctx.stub.getState(policyId);
            if (!policyAsBytes || policyAsBytes.length === 0) {
                throw new Error(`Policy ${policyId} does not exist`);
            }
            try {
                const insurancePolicy = new insuranceModel_1.InsuranceModel(JSON.parse(policyAsBytes.toString()));
                insurancePolicy.updateClaim(claimId, newStatus);
                yield ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
            }
            catch (error) {
                // @ts-ignore
                throw new Error(`Error updating claim status: ${error.message}`);
            }
            console.info('============= END : Update Claim Status ===========');
        });
    }
    // Add a Document to a Claim
    addClaimDocument(ctx, policyId, claimId, documentId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('============= START : Add Claim Document ===========');
            const policyAsBytes = yield ctx.stub.getState(policyId);
            if (!policyAsBytes || policyAsBytes.length === 0) {
                throw new Error(`Policy ${policyId} does not exist`);
            }
            try {
                const insurancePolicy = new insuranceModel_1.InsuranceModel(JSON.parse(policyAsBytes.toString()));
                insurancePolicy.addDocument(claimId, documentId);
                yield ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
            }
            catch (error) {
                // @ts-ignore
                throw new Error(`Error adding claim document: ${error.message}`);
            }
            console.info('============= END : Add Claim Document ===========');
        });
    }
    // Retrieve Policies by Policy Holder ID
    getPolicyByHolder(ctx, policyHolderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                selector: {
                    policyHolderID: policyHolderId
                }
            };
            const iterator = yield ctx.stub.getQueryResult(JSON.stringify(query));
            const results = [];
            let result = yield iterator.next();
            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                }
                catch (err) {
                    console.log(err);
                    record = strValue;
                }
                results.push(record);
                result = yield iterator.next();
            }
            return JSON.stringify(results);
        });
    }
    // Get Remaining Coverage for a Policy
    getRemainingCoverage(ctx, policyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const policyAsBytes = yield ctx.stub.getState(policyId);
            if (!policyAsBytes || policyAsBytes.length === 0) {
                throw new Error(`Policy ${policyId} does not exist`);
            }
            const insurancePolicy = new insuranceModel_1.InsuranceModel(JSON.parse(policyAsBytes.toString()));
            return insurancePolicy.getRemainingCoverage();
        });
    }
    // Retrieve the History of a Policy
    getPolicyHistory(ctx, policyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const iterator = yield ctx.stub.getHistoryForKey(policyId);
            const results = [];
            let result = yield iterator.next();
            while (!result.done) {
                // @ts-ignore
                const modification = {
                    txId: result.value.txId,
                    value: JSON.parse(result.value.value.toString("utf8")),
                    timestamp: result.value.timestamp,
                    isDelete: result.value.isDelete
                };
                results.push(modification);
                result = yield iterator.next();
            }
            return JSON.stringify(results);
        });
    }
    // Query Policies by Policy Type
    queryPoliciesByType(ctx, policyType) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                selector: {
                    policyType: policyType
                }
            };
            const iterator = yield ctx.stub.getQueryResult(JSON.stringify(query));
            const results = [];
            let result = yield iterator.next();
            while (!result.done) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                }
                catch (err) {
                    console.log(err);
                    record = strValue;
                }
                results.push(record);
                result = yield iterator.next();
            }
            return JSON.stringify(results);
        });
    }
}
exports.InsuranceContract = InsuranceContract;
exports.default = InsuranceContract;
