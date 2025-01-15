import { Context } from 'fabric-contract-api';
import { Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { SupplyChain, ProductStatusType, Distribution, QualityCheck } from './models/supplyChainModel';

@Info({ title: 'SupplyChainContract', description: 'Supply Chain Management Contract' })
export class SupplyChainContract extends Contract {
    constructor() {
        super('SupplyChainContract');
    }

    // Initialize the ledger with some predefined data (if necessary)
    @Transaction()
    public async initLedger(ctx: Context): Promise<void> {
        console.info('Initializing Supply Chain Ledger');
    }

    // Create a new product in the supply chain
    @Transaction()
    @Returns('string')
    public async createProduct(ctx: Context, productData: string): Promise<string> {
        try {
            const data = JSON.parse(productData);
            const exists = await this.productExists(ctx, data.productId);

            if (exists) {
                throw new Error(`Product ${data.productId} already exists`);
            }

            const product = new SupplyChain(
                data.productId,
                data.productName,
                data.manufacturer,
                new Date(data.manufactureDate),
                new Date(data.expiryDate),
                data.batchNumber,
                data.quantity,
                data.unitPrice,
                data.storage,
                data.quality || [] // Default to empty array if no quality data is provided
            );

            await ctx.stub.putState(data.productId, Buffer.from(JSON.stringify(product)));
            return data.productId;
        } catch (error) {
            // @ts-ignore
            throw new Error(`Failed to create product: ${error.message}`);
        }
    }

    // Check if a product already exists
    @Transaction(false)
    @Returns('boolean')
    public async productExists(ctx: Context, productId: string): Promise<boolean> {
        const productBuffer = await ctx.stub.getState(productId);
        return productBuffer?.length > 0;
    }

    // Retrieve product details from the ledger
    @Transaction(false)
    @Returns('string')
    public async getProduct(ctx: Context, productId: string): Promise<string> {
        try {
            const exists = await this.productExists(ctx, productId);
            if (!exists) {
                throw new Error(`Product ${productId} does not exist`);
            }

            const productBuffer = await ctx.stub.getState(productId);
            return productBuffer.toString();
        } catch (error) {
            // @ts-ignore
            throw new Error(`Failed to get product: ${error.message}`);
        }
    }

    // Add a distributor for the product
    @Transaction()
    public async addDistributor(ctx: Context, productId: string, distributorData: string): Promise<void> {
        try {
            const exists = await this.productExists(ctx, productId);
            if (!exists) {
                throw new Error(`Product ${productId} does not exist`);
            }

            const productBuffer = await ctx.stub.getState(productId);
            const productData = JSON.parse(productBuffer.toString());
            const product = new SupplyChain(
                productData.productId,
                productData.productName,
                productData.manufacturer,
                new Date(productData.manufactureDate),
                new Date(productData.expiryDate),
                productData.batchNumber,
                productData.quantity,
                productData.unitPrice,
                productData.storage,
                productData.quality || []
            );

            const distributor = JSON.parse(distributorData);
            product.addDistributor(
                distributor.distributorId,
                distributor.name,
                distributor.location
            );

            await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Failed to add distributor: ${error.message}`);
        }
    }

    // Add a quality check for the product
    @Transaction()
    public async addQualityCheck(ctx: Context, productId: string, qualityData: string): Promise<void> {
        try {
            const exists = await this.productExists(ctx, productId);
            if (!exists) {
                throw new Error(`Product ${productId} does not exist`);
            }

            const productBuffer = await ctx.stub.getState(productId);
            const productData = JSON.parse(productBuffer.toString());
            const product = new SupplyChain(
                productData.productId,
                productData.productName,
                productData.manufacturer,
                new Date(productData.manufactureDate),
                new Date(productData.expiryDate),
                productData.batchNumber,
                productData.quantity,
                productData.unitPrice,
                productData.storage,
                productData.quality || []
            );

            const qualityCheck = JSON.parse(qualityData);
            product.addQualityCheck(
                qualityCheck.inspector,
                qualityCheck.temperature,
                qualityCheck.humidity,
                qualityCheck.notes
            );

            await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Failed to add quality check: ${error.message}`);
        }
    }

    // Update the status of a product
    @Transaction()
    public async updateProductStatus(ctx: Context, productId: string, newStatus: ProductStatusType): Promise<void> {
        try {
            const exists = await this.productExists(ctx, productId);
            if (!exists) {
                throw new Error(`Product ${productId} does not exist`);
            }

            const productBuffer = await ctx.stub.getState(productId);
            const productData = JSON.parse(productBuffer.toString());
            const product = new SupplyChain(
                productData.productId,
                productData.productName,
                productData.manufacturer,
                new Date(productData.manufactureDate),
                new Date(productData.expiryDate),
                productData.batchNumber,
                productData.quantity,
                productData.unitPrice,
                productData.storage,
                productData.quality || []
            );

            product.updateStatus(newStatus);
            await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        } catch (error) {
            // @ts-ignore
            throw new Error(`Failed to update product status: ${error.message}`);
        }
    }

    // Query products by the manufacturer's name
    @Transaction(false)
    @Returns('string')
    public async queryByManufacturer(ctx: Context, manufacturer: string): Promise<string> {
        try {
            const query = {
                selector: {
                    manufacturer: manufacturer
                }
            };
            const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            const results = await this.getAllResults(iterator);
            return JSON.stringify(results);
        } catch (error) {
            // @ts-ignore
            throw new Error(`Failed to query by manufacturer: ${error.message}`);
        }
    }

    // Retrieve product's history
    @Transaction(false)
    @Returns('string')
    public async getProductHistory(ctx: Context, productId: string): Promise<string> {
        try {
            const exists = await this.productExists(ctx, productId);
            if (!exists) {
                throw new Error(`Product ${productId} does not exist`);
            }

            const iterator = await ctx.stub.getHistoryForKey(productId);
            const results = await this.getAllResults(iterator);
            return JSON.stringify(results);
        } catch (error) {
            // @ts-ignore
            throw new Error(`Failed to get product history: ${error.message}`);
        }
    }

    // Utility function to process query results
    private async getAllResults(iterator: any): Promise<any[]> {
        const results = [];
        let result = await iterator.next();

        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                try {
                    results.push(JSON.parse(result.value.value.toString()));
                } catch (err) {
                    results.push(result.value.value.toString());
                }
            }
            result = await iterator.next();
        }

        await iterator.close();
        return results;
    }
}

export default SupplyChainContract;
