import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addTaxTypeColumn() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Altering tables to add tax_type...');

        // PurchaseOrders
        try {
            await conn.query(`ALTER TABLE PurchaseOrders ADD tax_type VARCHAR(20) DEFAULT 'Exclude'`);
            console.log('✅ Added tax_type to PurchaseOrders');
            // Basic migration: If using old ppn_included logic, we might want to update tax_type based on it, 
            // but since ppn_included isn't a column we actually added (we just used it in frontend/API logic but DB might not have it if I didn't add it explicitly in previous steps? Wait, I added pnn_included to STATE in frontend, but did I add it to DB?
            // Checking previous steps... I implemented PPN logic in frontend but I don't recall adding ppn_included column to DB.
            // Let's check server/index.js.
            // In step 496/530, I updated endpoints but I didn't see 'ppn_included' in the SQL INSERT/SELECT in server/index.js. 
            // Ah, I missed adding 'ppn_included' to DB in the very first PPN task? 
            // The user request was "Adding PPN to Transactions". I added calculations in frontend.
            // Let's check PurchaseOrderList.jsx. It uses formData.ppn_included.
            // If I didn't save it to DB, then it wasn't persisting.
            // So this is a good chance to do it right with tax_type.
        } catch (e) {
            console.log('ℹ️ PurchaseOrders: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        // SalesOrders
        try {
            await conn.query(`ALTER TABLE SalesOrders ADD tax_type VARCHAR(20) DEFAULT 'Exclude'`);
            console.log('✅ Added tax_type to SalesOrders');
        } catch (e) {
            console.log('ℹ️ SalesOrders: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

addTaxTypeColumn();
