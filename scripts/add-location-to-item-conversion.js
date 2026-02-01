/**
 * Script untuk menambahkan kolom location_id ke ItemConversionDetails
 * dan menghapus warehouse_id dari ItemConversions (opsional - bisa dipertahankan)
 * 
 * Perubahan:
 * - ItemConversionDetails.location_id: lokasi spesifik per item (input/output bisa berbeda lokasi)
 */

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

        // Add location_id column to ItemConversionDetails
        console.log('📦 Adding location_id column to ItemConversionDetails...');
        try {
            await connection.query(`
                ALTER TABLE ItemConversionDetails ADD location_id INTEGER NULL
            `);
            console.log('✅ Column location_id added!');
        } catch (e) {
            if (e.message.includes('already exists') || e.message.includes('duplicate')) {
                console.log('ℹ️  Column location_id already exists, skipping...');
            } else {
                throw e;
            }
        }

        // Add foreign key constraint
        console.log('📦 Adding foreign key constraint for location_id...');
        try {
            await connection.query(`
                ALTER TABLE ItemConversionDetails 
                ADD FOREIGN KEY (location_id) REFERENCES Locations(id)
            `);
            console.log('✅ Foreign key added!');
        } catch (e) {
            if (e.message.includes('already exists') || e.message.includes('duplicate')) {
                console.log('ℹ️  Foreign key already exists, skipping...');
            } else {
                console.log('⚠️  Foreign key not added:', e.message);
            }
        }

        console.log('');
        console.log('🎉 Migration completed successfully!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('   1. Update backend API to use location_id per item');
        console.log('   2. Update frontend to allow location selection per item');

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
