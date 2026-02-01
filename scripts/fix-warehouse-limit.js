
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fix() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!');

        // 1. Find the FK name
        console.log('🔍 Finding Foreign Key constraint for warehouse_id...');
        const result = await connection.query(`
            SELECT role 
            FROM SYS.SYSFOREIGNKEY 
            WHERE foreign_table_id = (SELECT table_id FROM SYS.SYSTABLE WHERE table_name = 'ItemConversions')
            -- We assume it's the one pointing to Warehouses, usually we can check primary_table_id too
            AND primary_table_id = (SELECT table_id FROM SYS.SYSTABLE WHERE table_name = 'Warehouses')
        `);

        if (result.length > 0) {
            const roleName = result[0].role;
            console.log(`✅ Found FK: ${roleName}`);

            // 2. Drop the FK
            console.log(`🗑️ Dropping Foreign Key ${roleName}...`);
            await connection.query(`ALTER TABLE ItemConversions DROP FOREIGN KEY "${roleName}"`);
            console.log('✅ Foreign Key dropped!');

            // 3. Modify the column
            console.log('✏️ Modifying warehouse_id to allow NULL...');
            await connection.query(`ALTER TABLE ItemConversions MODIFY warehouse_id INTEGER NULL`);
            console.log('✅ Column modified!');

            // 4. Re-add the FK
            console.log('🔗 Re-adding Foreign Key...');
            await connection.query(`ALTER TABLE ItemConversions ADD FOREIGN KEY (warehouse_id) REFERENCES Warehouses(id)`);
            console.log('✅ Foreign Key re-added!');

        } else {
            console.log('⚠️ FK NOT FOUND. Checking if we can just modify the column directly (maybe no FK?)...');
            try {
                await connection.query(`ALTER TABLE ItemConversions MODIFY warehouse_id INTEGER NULL`);
                console.log('✅ Column modified!');
            } catch (e) {
                console.error('❌ Failed to modify column:', e.message);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
            console.log('🔌 Connection closed.');
        }
    }
}

fix();
