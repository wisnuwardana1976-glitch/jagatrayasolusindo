require('dotenv').config();
const odbc = require('odbc');

async function checkARAdjustments() {
    console.log('Connecting to database...');
    const connection = await odbc.connect(`DSN=${process.env.DB_DSN};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`);
    console.log('Connected!');

    console.log('\n=== All AR Adjustments ===');
    const adjustments = await connection.query('SELECT id, doc_number, type, status, total_amount, allocate_to_invoice FROM ARAdjustments ORDER BY id DESC');
    console.log(JSON.stringify(adjustments, null, 2));

    console.log('\n=== AR Debit Adjustments (Posted) ===');
    const debitAdj = await connection.query("SELECT id, doc_number, type, status, total_amount FROM ARAdjustments WHERE type = 'DEBIT' AND status = 'Posted'");
    console.log(JSON.stringify(debitAdj, null, 2));

    await connection.close();
    console.log('\nConnection closed.');
}

checkARAdjustments().catch(console.error);
