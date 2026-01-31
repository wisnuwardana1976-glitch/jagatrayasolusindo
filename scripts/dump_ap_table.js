import http from 'http';

// Use a direct DB query script instead of API if possible, or just fetch ALL AP Invoices via API?
// But API /api/invoices/outstanding filters them.
// Is there an API to list ALL AP Invoices?
// /api/ap-invoices usually.

// Let's try to query DB directly using 'odbc' via a script running in the backend context?
// No, I can't easily run backend code.
// I can only hit APIs or write standalone scripts if they have DB access.
// Standalone script needs DB credentials and driver.

// Plan B: Create a temporary endpoint in server/index.js to dump table?
// Or better: Use the existing generic "/api/ap-invoices" endpoint if it exists?
// Let's check server/index.js for "ap-invoices" route.

// Assuming I don't know if it exists, I'll search for it.
// View line 2000-3000?

// Alternatively, create a script that connects to DB.
// I have 'odbc' installed.
// I can copy the connection string from .env (I can't read .env directly but I can try to guess or use standard).
// Actually, server/index.js uses `process.env`.
// I can write a script that loads .env and queries DB.

import dotenv from 'dotenv';
import odbc from 'odbc';
import fs from 'fs';
import path from 'path';

// I need to read .env manually because `import 'dotenv/config'` might not work if module not set up cleanly.
// I'll try to find where .env is.

const envPath = path.resolve('d:\\JAGATRAYA ERP', '.env');
const envConfig = dotenv.config({ path: envPath }).parsed;

async function run() {
    try {
        const connectionString = `Driver={SQL Anywhere 17};Host=${envConfig.DB_HOST}:${envConfig.DB_PORT};DatabaseName=${envConfig.DB_NAME};Uid=${envConfig.DB_USER};Pwd=${envConfig.DB_PASSWORD};`;
        const connection = await odbc.connect(connectionString);
        console.log('Connected!');

        const result = await connection.query('SELECT top 10 id, doc_number, status, total_amount, paid_amount FROM APInvoices ORDER BY id DESC');
        console.log(JSON.stringify(result, null, 2));

        await connection.close();
    } catch (e) {
        console.log('Error:', e);
    }
}

run();
