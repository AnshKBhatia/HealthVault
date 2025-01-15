import { Context, Contract } from 'fabric-contract-api';
import { InsuranceModel, PolicyStatus, ClaimStatus } from './models/insuranceModel';

export class InsuranceContract extends Contract {
    async initLedger(ctx: Context): Promise<void> {
        console.info('============= START : Initialize Insurance Ledger ===========');
        console.info('============= END : Initialize Insurance Ledger ===========');
    }

    async createInsurancePolicy(ctx: Context, policyId: string, policyData: string): Promise<void> {
        console.info('============= START : Create Insurance Policy ===========');

        const exists = await ctx.stub.getState(policyId);
        if (exists && exists.length > 0) {
            throw new Error(`Policy ${policyId} already exists`);
        }

        try {
            const insuranceData = JSON.parse(policyData);
            const insurancePolicy = new InsuranceModel(insuranceData);
            await ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error creating insurance policy: ${error.message}`);
        }

        console.info('============= END : Create Insurance Policy ===========');
    }

    async getInsurancePolicy(ctx: Context, policyId: string): Promise<string> {
        const policyAsBytes = await ctx.stub.getState(policyId);
        if (!policyAsBytes || policyAsBytes.length === 0) {
            throw new Error(`Policy ${policyId} does not exist`);
        }
        return policyAsBytes.toString();
    }

    async updatePolicyStatus(ctx: Context, policyId: string, newStatus: PolicyStatus): Promise<void> {
        console.info('============= START : Update Policy Status ===========');

        const policyAsBytes = await ctx.stub.getState(policyId);
        if (!policyAsBytes || policyAsBytes.length === 0) {
            throw new Error(`Policy ${policyId} does not exist`);
        }

        try {
            const insurancePolicy = new InsuranceModel(JSON.parse(policyAsBytes.toString()));
            insurancePolicy.updateStatus(newStatus);
            await ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error updating policy status: ${error.message}`);
        }

        console.info('============= END : Update Policy Status ===========');
    }

    async submitClaim(ctx: Context, policyId: string, claimData: string): Promise<void> {
        console.info('============= START : Submit Claim ===========');

        const policyAsBytes = await ctx.stub.getState(policyId);
        if (!policyAsBytes || policyAsBytes.length === 0) {
            throw new Error(`Policy ${policyId} does not exist`);
        }

        try {
            const insurancePolicy = new InsuranceModel(JSON.parse(policyAsBytes.toString()));
            insurancePolicy.addClaim(JSON.parse(claimData));
            await ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error submitting claim: ${error.message}`);
        }

        console.info('============= END : Submit Claim ===========');
    }

    async updateClaimStatus(ctx: Context, policyId: string, claimId: string, newStatus: ClaimStatus): Promise<void> {
        console.info('============= START : Update Claim Status ===========');

        const policyAsBytes = await ctx.stub.getState(policyId);
        if (!policyAsBytes || policyAsBytes.length === 0) {
            throw new Error(`Policy ${policyId} does not exist`);
        }

        try {
            const insurancePolicy = new InsuranceModel(JSON.parse(policyAsBytes.toString()));
            insurancePolicy.updateClaim(claimId, newStatus);
            await ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error updating claim status: ${error.message}`);
        }

        console.info('============= END : Update Claim Status ===========');
    }

    async addClaimDocument(ctx: Context, policyId: string, claimId: string, documentId: string): Promise<void> {
        console.info('============= START : Add Claim Document ===========');

        const policyAsBytes = await ctx.stub.getState(policyId);
        if (!policyAsBytes || policyAsBytes.length === 0) {
            throw new Error(`Policy ${policyId} does not exist`);
        }

        try {
            const insurancePolicy = new InsuranceModel(JSON.parse(policyAsBytes.toString()));
            insurancePolicy.addDocument(claimId, documentId);
            await ctx.stub.putState(policyId, Buffer.from(insurancePolicy.toJSON()));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error adding claim document: ${error.message}`);
        }

        console.info('============= END : Add Claim Document ===========');
    }

    async getPolicyByHolder(ctx: Context, policyHolderId: string): Promise<string> {
        const query = {
            selector: {
                policyHolderID: policyHolderId
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const results = [];

        let result = await iterator.next();
        while (!result.done) {
            try {
                if (result.value && result.value.value) {
                    let record = JSON.parse(result.value.value.toString());
                    results.push(record);
                }
            } catch (err) {
                console.log('Error processing query result:', err);
            }
            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(results);
    }

    async getRemainingCoverage(ctx: Context, policyId: string): Promise<number> {
        const policyAsBytes = await ctx.stub.getState(policyId);
        if (!policyAsBytes || policyAsBytes.length === 0) {
            throw new Error(`Policy ${policyId} does not exist`);
        }

        const insurancePolicy = new InsuranceModel(JSON.parse(policyAsBytes.toString()));
        return insurancePolicy.getRemainingCoverage();
    }

    async getPolicyHistory(ctx: Context, policyId: string): Promise<string> {
        const iterator = await ctx.stub.getHistoryForKey(policyId);
        const results = [];

        let result = await iterator.next();
        while (!result.done) {
            try {
                if (result.value) {
                    const modification = {
                        txId: result.value.txId,
                        value: JSON.parse(result.value.value.toString()),
                        timestamp: result.value.timestamp,
                        isDelete: result.value.isDelete
                    };
                    results.push(modification);
                }
            } catch (error) {
                console.log('Error processing history entry:', error);
            }
            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(results);
    }

    async queryPoliciesByType(ctx: Context, policyType: string): Promise<string> {
        const query = {
            selector: {
                policyType: policyType
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const results = [];

        let result = await iterator.next();
        while (!result.done) {
            try {
                if (result.value && result.value.value) {
                    let record = JSON.parse(result.value.value.toString());
                    results.push(record);
                }
            } catch (err) {
                console.log('Error processing query result:', err);
            }
            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(results);
    }
}

export default InsuranceContract;