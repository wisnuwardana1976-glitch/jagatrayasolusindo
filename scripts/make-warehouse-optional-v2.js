
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function migrate() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!');

        console.log('📦 Attempting to modify warehouse_id using ALTER...');
        try {
            await connection.query(`
                ALTER TABLE ItemConversions MODIFY warehouse_id INTEGER NULL
            `);
            console.log('✅ Success with MODIFY!');
        } catch (e) {
            console.log('❌ MODIFY failed:', e.message);

            console.log('📦 Attempting with ALTER keyword...');
            await connection.query(`
                ALTER TABLE ItemConversions ALTER warehouse_id INTEGER NULL
            `);
            console.log('✅ Success with ALTER!');
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

migrate();
