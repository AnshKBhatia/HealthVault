export enum PolicyType {
    HEALTH = 'HEALTH',
    VEHICLE = 'VEHICLE',
    LIFE = 'LIFE',
    PROPERTY = 'PROPERTY'
}

export enum PolicyStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
    PENDING = 'PENDING',
    CLAIMED = 'CLAIMED'
}

export enum ClaimStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface Claim {
    claimId: string;
    dateSubmitted: string;
    amount: number;
    status: ClaimStatus;
    description: string;
    documents: string[];
}

export interface InsuranceTerms {
    deductible: number;
    copayment: number;
    exclusions: string[];
    waitingPeriod: number;
    maxCoverage: number;
}

export interface Insurance {
    policyId: string;
    policyHolderName: string;
    policyHolderID: string;
    policyType: PolicyType;
    coverageAmount: number;
    premium: number;
    startDate: string;
    endDate: string;
    status: PolicyStatus;
    claims: Claim[];
    terms: InsuranceTerms;
    lastUpdated: string;
    createdAt: string;
}

export class InsuranceModel {
    private data: Insurance;
    private static readonly MINIMUM_COVERAGE = 1000;
    private static readonly MINIMUM_PREMIUM = 100;

    constructor(data: Partial<Insurance>) {
        this.validateRequiredFields(data);
        this.data = {
            ...data,
            claims: data.claims || [],
            createdAt: data.createdAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        } as Insurance;
    }

    private validateRequiredFields(data: Partial<Insurance>): void {
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

        requiredFields.forEach(field => {
            // @ts-ignore
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        });

        this.validateAmounts(data.coverageAmount!, data.premium!);
        this.validateDates(data.startDate!, data.endDate!);
        this.validatePolicyType(data.policyType!);
    }

    private validateAmounts(coverage: number, premium: number): void {
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

    private validateDates(startDate: string, endDate: string): void {
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

    private validatePolicyType(type: PolicyType): void {
        if (!Object.values(PolicyType).includes(type)) {
            throw new Error('Invalid policy type');
        }
    }

    public getDetails(): Insurance {
        return { ...this.data }; // Using spread operator for a shallow copy
    }

    public updateStatus(newStatus: PolicyStatus): void {
        if (this.data.status === PolicyStatus.CANCELLED) {
            throw new Error('Cannot update status of a cancelled policy');
        }
        if (this.data.status === PolicyStatus.EXPIRED && newStatus !== PolicyStatus.CLAIMED) {
            throw new Error('Expired policy can only be updated to claimed status');
        }

        this.data.status = newStatus;
        this.data.lastUpdated = new Date().toISOString();
    }

    public addClaim(claim: Omit<Claim, 'claimId' | 'status'>): void {
        if (this.data.status !== PolicyStatus.ACTIVE) {
            throw new Error('Claims can only be added to active policies');
        }

        const totalApprovedClaims = this.data.claims
            .filter(c => c.status === ClaimStatus.APPROVED)
            .reduce((sum, claim) => sum + claim.amount, 0);

        if (totalApprovedClaims + claim.amount > this.data.coverageAmount) {
            throw new Error('Claim amount exceeds remaining coverage');
        }

        const newClaim: Claim = {
            ...claim,
            claimId: `CLM-${Date.now()}-${this.data.claims.length + 1}`,
            status: ClaimStatus.PENDING,
            documents: claim.documents || []
        };

        this.data.claims.push(newClaim);
        this.data.lastUpdated = new Date().toISOString();
    }

    public updateClaim(claimId: string, newStatus: ClaimStatus): void {
        const claim = this.data.claims.find(c => c.claimId === claimId);

        if (!claim) {
            throw new Error('Claim not found');
        }

        if (claim.status !== ClaimStatus.PENDING) {
            throw new Error('Can only update pending claims');
        }

        claim.status = newStatus;
        this.data.lastUpdated = new Date().toISOString();
    }

    public getRemainingCoverage(): number {
        const approvedClaimsTotal = this.data.claims
            .filter(c => c.status === ClaimStatus.APPROVED)
            .reduce((sum, claim) => sum + claim.amount, 0);

        return Math.max(this.data.coverageAmount - approvedClaimsTotal, 0);
    }

    public getRemainingValidity(): number {
        const currentDate = new Date();
        const endDate = new Date(this.data.endDate);
        const timeDiff = endDate.getTime() - currentDate.getTime();
        return Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 0);
    }

    public isExpired(): boolean {
        return new Date() > new Date(this.data.endDate);
    }

    public addDocument(claimId: string, documentId: string): void {
        const claim = this.data.claims.find(c => c.claimId === claimId);

        if (!claim) {
            throw new Error('Claim not found');
        }

        claim.documents.push(documentId);
        this.data.lastUpdated = new Date().toISOString();
    }

    public toJSON(): string {
        return JSON.stringify(this.data);
    }
}
