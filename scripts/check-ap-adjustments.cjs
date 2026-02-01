const odbc = require('odbc');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkData() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('Connected!\n');

        // Check APAdjustments
        console.log('=== APAdjustments (DEBIT only) ===');
        const adjustments = await connection.query("SELECT id, doc_number, type, status, total_amount, allocate_to_invoice FROM APAdjustments WHERE type = 'DEBIT'");
        console.log(JSON.stringify(adjustments, null, 2));

        // Check APAdjustmentAllocations
        console.log('\n=== APAdjustmentAllocations ===');
        const allocations = await connection.query('SELECT * FROM APAdjustmentAllocations');
        console.log(JSON.stringify(allocations, null, 2));

        // Check AP Outstanding calculated
        console.log('\n=== AP Outstanding (calculated with adjustment) ===');
        const outstanding = await connection.query(`
          SELECT 
            ap.id,
            ap.doc_number,
            ap.total_amount,
            COALESCE(ap.paid_amount, 0) as paid_amount,
            COALESCE((
              SELECT SUM(apaa.allocated_amount)
              FROM APAdjustmentAllocations apaa
              JOIN APAdjustments apa ON apaa.adjustment_id = apa.id
              WHERE apaa.ap_invoice_id = ap.id 
              AND apa.status = 'Posted' 
              AND apa.type = 'DEBIT'
            ), 0) as debit_adj_amount,
            (ap.total_amount - COALESCE(ap.paid_amount, 0) - COALESCE((
              SELECT SUM(apaa.allocated_amount)
              FROM APAdjustmentAllocations apaa
              JOIN APAdjustments apa ON apaa.adjustment_id = apa.id
              WHERE apaa.ap_invoice_id = ap.id 
              AND apa.status = 'Posted' 
              AND apa.type = 'DEBIT'
            ), 0)) as outstanding
          FROM APInvoices ap
          WHERE ap.status IN ('Posted', 'Partial')
        `);
        console.log(JSON.stringify(outstanding, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
            console.log('\nConnection closed.');
        }
    }
}

checkData();
