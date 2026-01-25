import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createCoaSegmentsTable() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!');

        // Create CoaSegments table
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS CoaSegments (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                segment_number INTEGER NOT NULL,
                segment_name VARCHAR(100) NOT NULL,
                description VARCHAR(255),
                active CHAR(1) DEFAULT 'Y',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        try {
            await connection.query(createTableSQL);
            console.log('✅ CoaSegments table created successfully!');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('ℹ️ CoaSegments table already exists');
            } else {
                throw err;
            }
        }

        // Check if table has data
        const existing = await connection.query('SELECT COUNT(*) as count FROM CoaSegments');
        if (existing[0].count === 0) {
            // Insert default segments
            const defaultSegments = [
                { number: 1, name: 'Segment1', description: 'Segment pertama untuk kode akun' },
                { number: 2, name: 'Segment2', description: 'Segment kedua untuk kode akun' },
                { number: 3, name: 'Segment3', description: 'Segment ketiga untuk kode akun' },
                { number: 4, name: 'Segment4', description: 'Segment keempat untuk kode akun' },
                { number: 5, name: 'Segment5', description: 'Segment kelima untuk kode akun' },
                { number: 6, name: 'Segment6', description: 'Segment keenam untuk kode akun' }
            ];

            for (const seg of defaultSegments) {
                await connection.query(
                    'INSERT INTO CoaSegments (segment_number, segment_name, description) VALUES (?, ?, ?)',
                    [seg.number, seg.name, seg.description]
                );
            }
            console.log('✅ Default segments inserted!');
        } else {
            console.log('ℹ️ Segments already exist, skipping insert');
        }

        // Verify
        const result = await connection.query('SELECT * FROM CoaSegments ORDER BY segment_number');
        console.log('\n📋 Current COA Segments:');
        result.forEach(row => {
            console.log(`  ${row.segment_number}. ${row.segment_name} - ${row.description}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
            console.log('\n🔌 Connection closed');
        }
    }
}

createCoaSegmentsTable();
