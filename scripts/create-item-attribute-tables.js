import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createItemAttributeTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        // 1. ItemGroups
        console.log('Creating ItemGroups table...');
        try {
            await conn.query(`
                CREATE TABLE ItemGroups (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    description VARCHAR(300),
                    active CHAR(1) DEFAULT 'Y',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ ItemGroups table created');
        } catch (e) {
            console.log('⚠️ ItemGroups:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 2. ItemCategories
        console.log('Creating ItemCategories table...');
        try {
            await conn.query(`
                CREATE TABLE ItemCategories (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    description VARCHAR(300),
                    active CHAR(1) DEFAULT 'Y',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ ItemCategories table created');
        } catch (e) {
            console.log('⚠️ ItemCategories:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 3. ItemBrands
        console.log('Creating ItemBrands table...');
        try {
            await conn.query(`
                CREATE TABLE ItemBrands (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    description VARCHAR(300),
                    active CHAR(1) DEFAULT 'Y',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ ItemBrands table created');
        } catch (e) {
            console.log('⚠️ ItemBrands:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 4. ItemModels
        console.log('Creating ItemModels table...');
        try {
            await conn.query(`
                CREATE TABLE ItemModels (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    brand_id INTEGER NULL,
                    description VARCHAR(300),
                    active CHAR(1) DEFAULT 'Y',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ ItemModels table created');
        } catch (e) {
            console.log('⚠️ ItemModels:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 5. Add columns to Items table
        console.log('\nAdding columns to Items table...');
        const columns = [
            { name: 'group_id', type: 'INTEGER NULL' },
            { name: 'category_id', type: 'INTEGER NULL' },
            { name: 'brand_id', type: 'INTEGER NULL' },
            { name: 'model_id', type: 'INTEGER NULL' },
        ];
        for (const col of columns) {
            try {
                await conn.query(`ALTER TABLE Items ADD ${col.name} ${col.type}`);
                console.log(`✅ Column ${col.name} added to Items`);
            } catch (e) {
                console.log(`⚠️ ${col.name}:`, e.odbcErrors ? e.odbcErrors[0].message : e.message);
            }
        }

        await conn.close();
        await pool.close();
        console.log('\n✅ All Item attribute tables created successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createItemAttributeTables();
