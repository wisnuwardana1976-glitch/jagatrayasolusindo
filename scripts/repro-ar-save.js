import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to DB.');

        // Get dependencies
        const partner = await connection.query("SELECT TOP 1 id FROM Partners");
        const item = await connection.query("SELECT TOP 1 id FROM Items");
        const transcode = await connection.query("SELECT TOP 1 id FROM Transcodes");
        const salesperson = await connection.query("SELECT TOP 1 id FROM SalesPersons");
        const paymentTerm = await connection.query("SELECT TOP 1 id FROM PaymentTerms");

        const payload = {
            doc_number: "INV/TEST/REPRO/001",
            doc_date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            partner_id: partner[0]?.id || 1,
            shipment_id: null,
            total_amount: 10000,
            status: "Draft",
            notes: "Reproduction Test",
            transcode_id: transcode[0]?.id || null,
            tax_type: "Exclude",
            sales_person_id: salesperson[0]?.id || null,
            payment_term_id: paymentTerm[0]?.id || null,
            items: [
                {
                    item_id: item[0]?.id || 1,
                    description: "Test Item",
                    quantity: 1,
                    unit_price: 10000,
                    amount: 10000
                }
            ]
        };

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('http://localhost:3001/api/ar-invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

run();
