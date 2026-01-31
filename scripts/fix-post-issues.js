import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixTables() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Checking ItemStocks table...');
        try {
            await connection.query('SELECT count(*) FROM ItemStocks');
            console.log('✅ ItemStocks exists');
        } catch (e) {
            console.log('📦 Creating ItemStocks table...');
            await connection.query(`
                CREATE TABLE ItemStocks (
                    id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                    item_id INTEGER NOT NULL,
                    warehouse_id INTEGER NOT NULL,
                    quantity DECIMAL(18,4) DEFAULT 0,
                    average_cost DECIMAL(18,2) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    FOREIGN KEY (item_id) REFERENCES Items(id),
                    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(id),
                    CONSTRAINT UQ_ItemWarehouse UNIQUE (item_id, warehouse_id)
                )
            `);
            console.log('✅ Created ItemStocks table');
        }

        console.log('Fixing Identity for JournalVouchers...');
        // Get max id
        const maxResult = await connection.query('SELECT MAX(id) as max_id FROM JournalVouchers');
        const maxId = maxResult[0].max_id || 0;
        console.log('Max JV ID:', maxId);

        // In Sybase SQL Anywhere, you reset identity using ALTER TABLE
        // But safer way if we can't alter is to insert with explicit ID once if needed, or hope DB handles it.
        // Actually, "Index PRIMARY... would not be unique" on insert usually means the internal counter is lower than existing max ID.
        // This happens if rows were inserted with explicit IDs previously.

        // Let's try to find a gap or just explicitly insert for now? 
        // Better: let's try to update the identity manually by inserting a dummy row with MAX+1 and deleting it?
        // SQL Anywhere usually auto-updates identity on explicit insert.

        /*
        await connection.query(`INSERT INTO JournalVouchers (id, doc_number, doc_date, description, status, source_type, ref_id) 
                              VALUES (${maxId + 1}, 'DUMMY', '2020-01-01', 'Dummy', 'Draft', 'OTHER', 0)`);
        await connection.query(`DELETE FROM JournalVouchers WHERE id = ${maxId + 1}`);
        console.log('✅ Reseeded JournalVouchers identity');
        */
        // Actually Sybase uses sa_reset_identity
        try {
            await connection.query(`call sa_reset_identity('JournalVouchers', 'DBA', ${maxId + 1})`);
            console.log('✅ Reset JournalVouchers identity using sa_reset_identity');
        } catch (e) {
            console.log('⚠️ Could not use sa_reset_identity: ' + e.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

fixTables();
