require('dotenv').config();
const odbc = require('odbc');

async function checkColumns() {
    try {
        const connection = await odbc.connect(`DSN=${process.env.DB_DSN};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`);
        console.log('Connected!');

        // Get columns for ARInvoices using generic query if specific metadata generic fails, 
        // but let's try selecting top 1 and looking at keys
        const result = await connection.query('SELECT TOP 1 * FROM ARInvoices');
        console.log('Columns in ARInvoices:', Object.keys(result[0] || {}));

        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkColumns();
