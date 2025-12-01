#!/usr/bin/env node

const bcryptjs = require('bcryptjs');

async function generateHash() {
  // Get password and rounds from command line arguments or use defaults
  const password = process.argv[2] || 'Admincch@2025';
  const rounds = parseInt(process.argv[3] || '10', 10);
  
  console.log('='.repeat(80));
  console.log('Password Hash Generator for SQL User Seeding');
  console.log('='.repeat(80));
  console.log();
  
  console.log('Input:');
  console.log('  Password:', password);
  console.log('  Salt Rounds:', rounds);
  console.log();
  
  console.log('Generating hash...');
  const hash = await bcryptjs.hash(password, rounds);
  console.log();
  
  console.log('Generated Hash:');
  console.log('  ' + hash);
  console.log();
  
  console.log('='.repeat(80));
  console.log('SQL INSERT Statements');
  console.log('='.repeat(80));
  console.log();
  
  console.log('-- Insert Administrator User');
  console.log(`INSERT INTO "User" (`);
  console.log(`  "username",`);
  console.log(`  "passwordHash",`);
  console.log(`  "role",`);
  console.log(`  "fullName",`);
  console.log(`  "email",`);
  console.log(`  "isActive",`);
  console.log(`  "createdAt"`);
  console.log(`) VALUES (`);
  console.log(`  'admin',`);
  console.log(`  '${hash}',`);
  console.log(`  'ADMIN',`);
  console.log(`  'System Administrator',`);
  console.log(`  'admin@foodbank.church',`);
  console.log(`  true,`);
  console.log(`  NOW()`);
  console.log(`) ON CONFLICT ("username") DO NOTHING;`);
  console.log();
  
  console.log('-- Insert Staff User');
  console.log(`INSERT INTO "User" (`);
  console.log(`  "username",`);
  console.log(`  "passwordHash",`);
  console.log(`  "role",`);
  console.log(`  "fullName",`);
  console.log(`  "email",`);
  console.log(`  "isActive",`);
  console.log(`  "createdAt"`);
  console.log(`) VALUES (`);
  console.log(`  'staff',`);
  console.log(`  '${hash}',`);
  console.log(`  'STAFF',`);
  console.log(`  'Staff User',`);
  console.log(`  'staff@foodbank.church',`);
  console.log(`  true,`);
  console.log(`  NOW()`);
  console.log(`) ON CONFLICT ("username") DO NOTHING;`);
  console.log();
  
  console.log('='.repeat(80));
  console.log('Complete Transaction');
  console.log('='.repeat(80));
  console.log();
  console.log('BEGIN;');
  console.log();
  console.log('-- Insert Administrator User');
  console.log(`INSERT INTO "User" ("username", "passwordHash", "role", "fullName", "email", "isActive", "createdAt")`);
  console.log(`VALUES ('admin', '${hash}', 'ADMIN', 'System Administrator', 'admin@foodbank.church', true, NOW())`);
  console.log(`ON CONFLICT ("username") DO NOTHING;`);
  console.log();
  console.log('-- Insert Staff User');
  console.log(`INSERT INTO "User" ("username", "passwordHash", "role", "fullName", "email", "isActive", "createdAt")`);
  console.log(`VALUES ('staff', '${hash}', 'STAFF', 'Staff User', 'staff@foodbank.church', true, NOW())`);
  console.log(`ON CONFLICT ("username") DO NOTHING;`);
  console.log();
  console.log('COMMIT;');
  console.log();
  
  console.log('='.repeat(80));
  console.log('Usage Instructions');
  console.log('='.repeat(80));
  console.log();
  console.log('1. Copy the SQL statements above');
  console.log('2. Connect to your PostgreSQL database');
  console.log('3. Execute the SQL transaction');
  console.log('4. Verify with: SELECT * FROM "User" WHERE "role" IN (\'ADMIN\', \'STAFF\');');
  console.log();
  console.log('Default Login Credentials:');
  console.log('  Admin - Username: admin, Password:', password);
  console.log('  Staff - Username: staff, Password:', password);
  console.log();
  console.log('⚠️  IMPORTANT: Change these passwords in production!');
  console.log();
}

// Handle errors
generateHash().catch((error) => {
  console.error('Error generating hash:');
  console.error(error);
  process.exit(1);
});
