import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createCrmTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        // 1. CrmLeads
        console.log('Creating CrmLeads table...');
        try {
            await conn.query(`
                CREATE TABLE CrmLeads (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    lead_no VARCHAR(30) NOT NULL UNIQUE,
                    company_name VARCHAR(200) NOT NULL,
                    contact_name VARCHAR(100),
                    phone VARCHAR(50),
                    email VARCHAR(100),
                    address VARCHAR(500),
                    city VARCHAR(100),
                    source VARCHAR(50),
                    status VARCHAR(20) DEFAULT 'New',
                    assigned_to VARCHAR(100),
                    notes VARCHAR(1000),
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ CrmLeads table created');
        } catch (e) {
            console.log('⚠️ CrmLeads:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 2. CrmContacts
        console.log('Creating CrmContacts table...');
        try {
            await conn.query(`
                CREATE TABLE CrmContacts (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    contact_name VARCHAR(100) NOT NULL,
                    title VARCHAR(50),
                    phone VARCHAR(50),
                    mobile VARCHAR(50),
                    email VARCHAR(100),
                    department VARCHAR(100),
                    lead_id INTEGER NULL,
                    customer_id INTEGER NULL,
                    is_primary CHAR(1) DEFAULT 'N',
                    notes VARCHAR(500),
                    active CHAR(1) DEFAULT 'Y',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ CrmContacts table created');
        } catch (e) {
            console.log('⚠️ CrmContacts:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 3. CrmOpportunities
        console.log('Creating CrmOpportunities table...');
        try {
            await conn.query(`
                CREATE TABLE CrmOpportunities (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    opp_no VARCHAR(30) NOT NULL UNIQUE,
                    lead_id INTEGER NULL,
                    customer_id INTEGER NULL,
                    title VARCHAR(200) NOT NULL,
                    estimated_value DECIMAL(18,2) DEFAULT 0,
                    currency_code VARCHAR(10) DEFAULT 'IDR',
                    probability INTEGER DEFAULT 0,
                    stage VARCHAR(30) DEFAULT 'Prospecting',
                    expected_close_date DATE,
                    assigned_to VARCHAR(100),
                    notes VARCHAR(1000),
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ CrmOpportunities table created');
        } catch (e) {
            console.log('⚠️ CrmOpportunities:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 4. CrmQuotations
        console.log('Creating CrmQuotations table...');
        try {
            await conn.query(`
                CREATE TABLE CrmQuotations (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    quot_no VARCHAR(30) NOT NULL UNIQUE,
                    opportunity_id INTEGER NULL,
                    customer_id INTEGER NULL,
                    customer_name VARCHAR(200),
                    quotation_date DATE NOT NULL,
                    valid_until DATE,
                    subtotal DECIMAL(18,2) DEFAULT 0,
                    discount_pct DECIMAL(5,2) DEFAULT 0,
                    discount_amount DECIMAL(18,2) DEFAULT 0,
                    tax_pct DECIMAL(5,2) DEFAULT 0,
                    tax_amount DECIMAL(18,2) DEFAULT 0,
                    total DECIMAL(18,2) DEFAULT 0,
                    currency_code VARCHAR(10) DEFAULT 'IDR',
                    status VARCHAR(20) DEFAULT 'Draft',
                    notes VARCHAR(1000),
                    created_by VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ CrmQuotations table created');
        } catch (e) {
            console.log('⚠️ CrmQuotations:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 5. CrmQuotationItems
        console.log('Creating CrmQuotationItems table...');
        try {
            await conn.query(`
                CREATE TABLE CrmQuotationItems (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    quotation_id INTEGER NOT NULL,
                    item_id INTEGER NULL,
                    item_code VARCHAR(50),
                    description VARCHAR(300) NOT NULL,
                    qty DECIMAL(18,4) DEFAULT 1,
                    unit VARCHAR(20),
                    unit_price DECIMAL(18,2) DEFAULT 0,
                    discount_pct DECIMAL(5,2) DEFAULT 0,
                    total_price DECIMAL(18,2) DEFAULT 0,
                    sort_order INTEGER DEFAULT 0
                )
            `);
            console.log('✅ CrmQuotationItems table created');
        } catch (e) {
            console.log('⚠️ CrmQuotationItems:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // 6. CrmActivities
        console.log('Creating CrmActivities table...');
        try {
            await conn.query(`
                CREATE TABLE CrmActivities (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    activity_type VARCHAR(20) NOT NULL,
                    subject VARCHAR(200) NOT NULL,
                    description VARCHAR(1000),
                    activity_date TIMESTAMP NOT NULL,
                    due_date TIMESTAMP,
                    lead_id INTEGER NULL,
                    opportunity_id INTEGER NULL,
                    customer_id INTEGER NULL,
                    assigned_to VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'Planned',
                    priority VARCHAR(10) DEFAULT 'Normal',
                    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ CrmActivities table created');
        } catch (e) {
            console.log('⚠️ CrmActivities:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // Insert CRM transcodes
        console.log('\nInserting CRM transcodes...');
        try {
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('LD', 'Lead', 'LD', 0, 'Lead CRM')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('OPP', 'Opportunity', 'OPP', 0, 'Opportunity CRM')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('QUO', 'Quotation', 'QUO', 0, 'Quotation CRM')`);
            console.log('✅ CRM transcodes inserted');
        } catch (e) {
            console.log('⚠️ Transcodes:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\n✅ All CRM tables created successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createCrmTables();
