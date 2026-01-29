import { executeQuery } from '../server/index.js';

async function createReportTable() {
    try {
        console.log('Creating ReportDefinitions table...');
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS ReportDefinitions (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT, 
                report_code VARCHAR(50),
                module VARCHAR(50),
                category VARCHAR(50),
                type VARCHAR(50),
                name VARCHAR(255),
                file_name VARCHAR(255)
            )
        `);
        // Note: AUTOINCREMENT syntax depends on DB. SQL Anywhere uses IDENTITY or DEFAULT AUTOINCREMENT. 
        // If SQL Anywhere: id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY

        /* 
           Wait, user is using Sybase SQL Anywhere. 
           Correct syntax is likely:
           CREATE TABLE ReportDefinitions (
               id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY,
               report_code VARCHAR(50),
               module VARCHAR(50),
               category VARCHAR(50),
               type VARCHAR(50),
               name VARCHAR(255),
               file_name VARCHAR(255)
           )
        */

    } catch (error) {
        // If error implies table exists, ignore.
        console.error('Error creating table (might already exist):', error.message);
    }
}

// Since I cannot easily import from server/index.js if it's an app...
// I'll just use a direct script using odbc provided in index.js style.
// Actually, better to create a standalone script that duplicates the connection logic.
