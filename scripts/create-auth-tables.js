import dotenv from 'dotenv';
import odbc from 'odbc';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createAuthTables() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // 1. Roles
        try {
            await connection.query('DROP TABLE IF EXISTS Roles');
        } catch (e) { }
        await connection.query(`
            CREATE TABLE Roles (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                name VARCHAR(50) NOT NULL UNIQUE,
                description VARCHAR(255) NULL
            )
        `);
        console.log('Created Roles table');

        // 2. Users
        try {
            await connection.query('DROP TABLE IF EXISTS Users');
        } catch (e) { }
        await connection.query(`
            CREATE TABLE Users (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NULL,
                role_id INTEGER NULL,
                active CHAR(1) DEFAULT 'Y',
                FOREIGN KEY (role_id) REFERENCES Roles(id)
            )
        `);
        console.log('Created Users table');

        // 3. RolePermissions
        try {
            await connection.query('DROP TABLE IF EXISTS RolePermissions');
        } catch (e) { }
        await connection.query(`
            CREATE TABLE RolePermissions (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                role_id INTEGER NOT NULL,
                feature_key VARCHAR(50) NOT NULL,
                can_view CHAR(1) DEFAULT 'N',
                can_create CHAR(1) DEFAULT 'N',
                can_edit CHAR(1) DEFAULT 'N',
                can_delete CHAR(1) DEFAULT 'N',
                can_print CHAR(1) DEFAULT 'N',
                FOREIGN KEY (role_id) REFERENCES Roles(id)
            )
        `);
        console.log('Created RolePermissions table');

        // Seed Data
        // Create Super Admin Role
        await connection.query("INSERT INTO Roles (name, description) VALUES ('Super Admin', 'Full Access')");
        const roleResult = await connection.query("SELECT id FROM Roles WHERE name = 'Super Admin'");
        const roleId = roleResult[0].id;

        // Create Super Admin User (admin / password123)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await connection.query(
            "INSERT INTO Users (username, password_hash, full_name, role_id, active) VALUES (?, ?, ?, ?, ?)",
            ['admin', hashedPassword, 'Super Administrator', roleId, 'Y']
        );
        console.log('Seeded Super Admin user (admin / password123)');

        // Grant all permissions for Super Admin (This will be handled dynamically in code usually, 
        // but typically Super Admin bypasses permission checks. 
        // We can add specific permissions later if needed).

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

createAuthTables();
