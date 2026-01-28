
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugSql() {
    try {
        const connection = await odbc.connect(connectionString);

        const startDate = '2026-01-01';
        const endDate = '2026-01-31';

        let query = `
            SELECT
                s.*,
                so.doc_number as so_number,
                p.name as partner_name,
                l.name as location_name,
                (SELECT SUM(quantity) FROM ShipmentDetails WHERE shipment_id = s.id) as total_shipped,
                (SELECT SUM(quantity) FROM ARInvoiceDetails ard JOIN ARInvoices ari ON ard.ar_invoice_id = ari.id WHERE ari.shipment_id = s.id AND ari.status != 'Cancelled') as total_billed
            FROM Shipments s
            LEFT JOIN SalesOrders so ON s.so_id = so.id
            LEFT JOIN Partners p ON so.partner_id = p.id
            LEFT JOIN Locations l ON s.location_id = l.id
        `;

        query += ' WHERE s.doc_date BETWEEN ? AND ?';
        query += ' ORDER BY s.doc_number DESC';

        const params = [startDate, endDate];

        console.log('Executing Query:', query);
        console.log('Params:', params);

        const result = await connection.query(query, params);
        console.log('Result count:', result.length);

        await connection.close();
    } catch (error) {
        console.error('SQL Error:', error);
        if (error.odbcErrors) {
            console.error('ODBC Errors:', JSON.stringify(error.odbcErrors, null, 2));
        }
    }
}

debugSql();
