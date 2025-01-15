/**
 * @fileoverview Supply Chain Model Implementation
 * @author AnshKBhatia
 * @created 2025-01-14 04:31:01 UTC
 */

// Define types for better type safety
export type ProductStatusType = 'manufactured' | 'in-transit' | 'delivered' | 'expired';
export type QualityCheckStatus = 'passed' | 'failed' | 'pending';
export type StorageCondition = 'room-temperature' | 'refrigerated' | 'frozen';
type StatusTransitions = Record<ProductStatusType, ProductStatusType[]>;

// Interfaces for complex types
interface StorageRequirement {
    condition: StorageCondition;
    minTemp: number;
    maxTemp: number;
    minHumidity: number;
    maxHumidity: number;
}

export interface QualityCheck {
    qualityCheckId: string;
    checkDate: Date;
    status: QualityCheckStatus;
    temperature: number;
    humidity: number;
    inspector: string;
    notes: string[];
}

export interface Distribution {
    distributorId: string;
    name: string;
    receivedDate: Date;
    shippedDate: Date;
    status: ProductStatusType;
    location: string;
}

interface Retailer {
    retailerId: string;
    name: string;
    receivedDate: Date;
    location: string;
    quantity: number;
}

// Main Supply Chain Model Interface
export interface SupplyChainModel {
    productId: string;
    productName: string;
    manufacturer: string;
    manufactureDate: Date;
    expiryDate: Date;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
    status: ProductStatusType;
    distribution: Distribution[];
    retailer: Retailer;
    quality: QualityCheck[];
    storage: StorageRequirement;
    lastUpdated: Date;
    createdAt: Date;
    createdBy: string;
}

// Supply Chain Class Implementation
export class SupplyChain implements SupplyChainModel {
    public productId: string;
    public productName: string;
    public manufacturer: string;
    public manufactureDate: Date;
    public expiryDate: Date;
    public batchNumber: string;
    public quantity: number;
    public unitPrice: number;
    public status: ProductStatusType;
    public distribution: Distribution[];
    public retailer: Retailer;
    public quality: QualityCheck[];
    public storage: StorageRequirement;
    public lastUpdated: Date;
    public createdAt: Date;
    public createdBy: string;

    private readonly MINIMUM_QUANTITY = 0;
    private readonly MINIMUM_PRICE = 0;
    private readonly QUALITY_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    constructor(
        productId: string,
        productName: string,
        manufacturer: string,
        manufactureDate: Date,
        expiryDate: Date,
        batchNumber: string,
        quantity: number,
        unitPrice: number,
        storage: StorageRequirement,
        quality: QualityCheck[] = []
    ) {
        this.productId = productId;
        this.productName = productName;
        this.manufacturer = manufacturer;
        this.manufactureDate = new Date(manufactureDate);
        this.expiryDate = new Date(expiryDate);
        this.batchNumber = batchNumber;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.status = 'manufactured';
        this.storage = storage;
        this.quality = quality;
        this.distribution = [];
        this.retailer = {
            retailerId: '',
            name: '',
            receivedDate: new Date(),
            location: '',
            quantity: 0
        };
        this.createdAt = new Date('2025-01-14 04:31:01');
        this.lastUpdated = new Date('2025-01-14 04:31:01');
        this.createdBy = 'AnshKBhatia';

        this.validateSupplyChain();
    }

    private validateSupplyChain(): void {
        // Validate required fields
        if (!this.productId || !this.productName || !this.manufacturer) {
            throw new Error('Missing required product information');
        }

        // Validate amounts
        if (this.quantity <= this.MINIMUM_QUANTITY || this.unitPrice <= this.MINIMUM_PRICE) {
            throw new Error('Quantity and unit price must be positive numbers');
        }

        // Validate dates
        if (this.expiryDate <= this.manufactureDate) {
            throw new Error('Expiry date must be after manufacture date');
        }

        // Validate storage conditions
        this.validateStorageConditions();
    }

    private validateStorageConditions(): void {
        if (!this.storage) {
            throw new Error('Storage requirements must be specified');
        }

        if (this.storage.minTemp >= this.storage.maxTemp) {
            throw new Error('Invalid temperature range');
        }

        if (this.storage.minHumidity >= this.storage.maxHumidity) {
            throw new Error('Invalid humidity range');
        }
    }

    private validateStatusTransition(currentStatus: ProductStatusType, newStatus: ProductStatusType): boolean {
        const validTransitions: StatusTransitions = {
            'manufactured': ['in-transit', 'expired'],
            'in-transit': ['delivered', 'expired'],
            'delivered': ['expired'],
            'expired': []
        };

        return validTransitions[currentStatus]?.includes(newStatus) ?? false;
    }

    public updateStatus(newStatus: ProductStatusType): void {
        const isValidTransition = this.validateStatusTransition(this.status, newStatus);

        if (!isValidTransition) {
            throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
        }

        this.status = newStatus;
        this.lastUpdated = new Date('2025-01-14 04:31:01');
    }

    public addDistributor(distributorId: string, name: string, location: string): void {
        if (this.status !== 'manufactured') {
            throw new Error('Can only add distributor to manufactured products');
        }

        const distributor: Distribution = {
            distributorId,
            name,
            receivedDate: new Date('2025-01-14 04:31:01'),
            shippedDate: new Date('2025-01-14 04:31:01'),
            status: 'in-transit',
            location
        };

        this.distribution.push(distributor);
        this.updateStatus('in-transit');
    }

    public addQualityCheck(
        inspector: string,
        temperature: number,
        humidity: number,
        notes: string[] = []
    ): void {
        const lastCheck = this.quality[this.quality.length - 1];

        if (lastCheck) {
            const timeSinceLastCheck = new Date().getTime() - lastCheck.checkDate.getTime();
            if (timeSinceLastCheck < this.QUALITY_CHECK_INTERVAL) {
                throw new Error('Minimum interval between quality checks not met');
            }
        }

        const qualityCheck: QualityCheck = {
            qualityCheckId: `QC-${Date.now()}`,
            checkDate: new Date('2025-01-14 04:31:01'),
            status: this.determineQualityStatus(temperature, humidity),
            temperature,
            humidity,
            inspector,
            notes
        };

        this.quality.push(qualityCheck);
        this.lastUpdated = new Date('2025-01-14 04:31:01');
    }

    private determineQualityStatus(temperature: number, humidity: number): QualityCheckStatus {
        if (!this.isStorageCompliant(temperature, humidity)) {
            return 'failed';
        }
        return 'passed';
    }

    public isStorageCompliant(temperature: number, humidity: number): boolean {
        return temperature >= this.storage.minTemp &&
            temperature <= this.storage.maxTemp &&
            humidity >= this.storage.minHumidity &&
            humidity <= this.storage.maxHumidity;
    }

    public isExpired(): boolean {
        return new Date('2025-01-14 04:31:01') > this.expiryDate;
    }

    public getTotalValue(): number {
        return this.quantity * this.unitPrice;
    }

    public getProductAge(): number {
        const currentDate = new Date('2025-01-14 04:31:01');
        const ageInMs = currentDate.getTime() - this.manufactureDate.getTime();
        return Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    }

    public getQualityHistory(): QualityCheck[] {
        return [...this.quality];
    }

    public getDistributionHistory(): Distribution[] {
        return [...this.distribution];
    }

    public toJSON(): object {
        return {
            productId: this.productId,
            productName: this.productName,
            manufacturer: this.manufacturer,
            manufactureDate: this.manufactureDate,
            expiryDate: this.expiryDate,
            batchNumber: this.batchNumber,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            status: this.status,
            distribution: this.distribution,
            retailer: this.retailer,
            quality: this.quality,
            storage: this.storage,
            lastUpdated: this.lastUpdated,
            createdAt: this.createdAt,
            createdBy: this.createdBy
        };
    }
}

export default SupplyChain;