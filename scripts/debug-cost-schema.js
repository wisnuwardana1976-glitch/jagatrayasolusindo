
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;

async function checkSchema() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to database.');

        // Check data for COM001
        const stocks = await connection.query(`
            SELECT s.warehouse_id, l.code as loc_code, s.quantity, s.average_cost 
            FROM ItemStocks s
            JOIN Items i ON s.item_id = i.id
            JOIN Locations l ON s.location_id = l.id
            WHERE i.code = 'COM001'
        `);
        console.log('Current Stocks for COM001:', stocks);

        if (stocks.length > 0) {
            console.log('Type of average_cost:', typeof stocks[0].average_cost);
            console.log('Value of average_cost:', stocks[0].average_cost);
        }

        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
