const odbc = require('odbc');

const connectionString = 'DSN=JAGATRAYA;UID=DBA;PWD=SQL';

async function renameColumn() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        const tables = [
            'PurchaseOrders',
            'SalesOrders',
            'Receivings',
            'APInvoices',
            'ARInvoices',
            'InventoryAdjustments',
            'APAdjustments',
            'ARAdjustments'
        ];

        for (const table of tables) {
            try {
                console.log(`Processing table: ${table}...`);

                // 1. Drop existing exchangerate_id column
                await connection.query(`ALTER TABLE ${table} DROP exchangerate_id`);
                console.log(`- Dropped exchangerate_id from ${table}`);

                // 2. Add new currency_code column
                await connection.query(`ALTER TABLE ${table} ADD currency_code VARCHAR(10) NULL`);
                console.log(`- Added currency_code to ${table}`);

            } catch (tableError) {
                console.error(`Error processing table ${table}:`, tableError.message);
                // Continue with next table even if one fails
            }
        }

        console.log('\nColumn renaming process completed for all tables.');

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Database connection closed.');
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
}

renameColumn();
