const { db, COLLECTIONS } = require('./firebase');

// Database utility functions
class Database {
    constructor() {
        this.db = db;
        this.collections = COLLECTIONS;
    }

    // Generic CRUD operations
    async create(collection, data, docId = null) {
        try {
            const docRef = docId ?
                this.db.collection(collection).doc(docId) :
                this.db.collection(collection).doc();

            await docRef.set({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return { id: docRef.id, ...data };
        } catch (error) {
            throw new Error(`Error creating document in ${collection}: ${error.message}`);
        }
    }

    async getById(collection, docId) {
        try {
            const doc = await this.db.collection(collection).doc(docId).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            throw new Error(`Error getting document from ${collection}: ${error.message}`);
        }
    }

    async update(collection, docId, data) {
        try {
            await this.db.collection(collection).doc(docId).update({
                ...data,
                updatedAt: new Date()
            });
            return { id: docId, ...data };
        } catch (error) {
            throw new Error(`Error updating document in ${collection}: ${error.message}`);
        }
    }

    async delete(collection, docId) {
        try {
            await this.db.collection(collection).doc(docId).delete();
            return { id: docId, deleted: true };
        } catch (error) {
            throw new Error(`Error deleting document from ${collection}: ${error.message}`);
        }
    }

    async getWhere(collection, field, operator, value, limit = null) {
        try {
            let query = this.db.collection(collection).where(field, operator, value);

            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const results = [];

            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return results;
        } catch (error) {
            throw new Error(`Error querying ${collection}: ${error.message}`);
        }
    }

    async getWhereMultiple(collection, conditions, limit = null) {
        try {
            let query = this.db.collection(collection);

            conditions.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });

            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const results = [];

            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return results;
        } catch (error) {
            throw new Error(`Error querying ${collection} with multiple conditions: ${error.message}`);
        }
    }

    async getAll(collection, limit = null) {
        try {
            let query = this.db.collection(collection);

            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const results = [];

            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return results;
        } catch (error) {
            throw new Error(`Error getting all documents from ${collection}: ${error.message}`);
        }
    }

    // Batch operations
    async batchCreate(collection, dataArray) {
        try {
            const batch = this.db.batch();
            const results = [];

            dataArray.forEach(data => {
                const docRef = this.db.collection(collection).doc();
                batch.set(docRef, {
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                results.push({ id: docRef.id, ...data });
            });

            await batch.commit();
            return results;
        } catch (error) {
            throw new Error(`Error batch creating in ${collection}: ${error.message}`);
        }
    }

    async batchUpdate(collection, updates) {
        try {
            const batch = this.db.batch();

            updates.forEach(update => {
                const docRef = this.db.collection(collection).doc(update.id);
                batch.update(docRef, {
                    ...update.data,
                    updatedAt: new Date()
                });
            });

            await batch.commit();
            return updates.map(update => ({ id: update.id, ...update.data }));
        } catch (error) {
            throw new Error(`Error batch updating in ${collection}: ${error.message}`);
        }
    }

    // Pagination
    async getPaginated(collection, page = 1, limit = 10, orderBy = 'createdAt', orderDirection = 'desc') {
        try {
            const offset = (page - 1) * limit;
            let query = this.db.collection(collection)
                .orderBy(orderBy, orderDirection)
                .offset(offset)
                .limit(limit);

            const snapshot = await query.get();
            const results = [];

            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            // Get total count
            const totalSnapshot = await this.db.collection(collection).get();
            const total = totalSnapshot.size;

            return {
                data: results,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Error getting paginated data from ${collection}: ${error.message}`);
        }
    }

    // Search functionality
    async search(collection, searchField, searchTerm, limit = 20) {
        try {
            // Note: Firestore doesn't support full-text search natively
            // This is a basic implementation - for production, consider using Algolia or Elasticsearch
            const snapshot = await this.db.collection(collection).get();
            const results = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data[searchField] &&
                    data[searchField].toString().toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({ id: doc.id, ...data });
                }
            });

            return results.slice(0, limit);
        } catch (error) {
            throw new Error(`Error searching in ${collection}: ${error.message}`);
        }
    }

    // Transaction support
    async runTransaction(transactionFunction) {
        try {
            return await this.db.runTransaction(transactionFunction);
        } catch (error) {
            throw new Error(`Error running transaction: ${error.message}`);
        }
    }
}

module.exports = new Database();