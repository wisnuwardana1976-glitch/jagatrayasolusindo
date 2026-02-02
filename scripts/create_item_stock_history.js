
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        // Check if table exists
        try {
            await connection.query(`SELECT TOP 1 * FROM ItemStockHistory`);
            console.log('Table ItemStockHistory already exists.');
        } catch (e) {
            console.log('Creating ItemStockHistory table...');

            await connection.query(`
                CREATE TABLE ItemStockHistory (
                    id INTEGER NOT NULL DEFAULT AUTOINCREMENT,
                    period VARCHAR(20) NOT NULL,
                    item_id INTEGER NOT NULL,
                    warehouse_id INTEGER NOT NULL,
                    location_id INTEGER,
                    start_qty NUMERIC(15,4) DEFAULT 0,
                    stock_in NUMERIC(15,4) DEFAULT 0,
                    stock_out NUMERIC(15,4) DEFAULT 0,
                    end_qty NUMERIC(15,4) DEFAULT 0,
                    average_cost NUMERIC(15,4) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    PRIMARY KEY (id),
                    CONSTRAINT UQ_History UNIQUE (period, item_id, warehouse_id, location_id)
                )
            `);
            console.log('Table Created.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
