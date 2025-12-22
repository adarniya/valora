const bcrypt = require('bcrypt');

async function generateHashes() {
  const password = 'password123';
  const saltRounds = 10;
  
  console.log('Generating bcrypt hash for password: password123\n');
  
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('✅ Generated Hash:');
  console.log(hash);
  console.log('\n📝 Use this in your SQL INSERT statements!');
  console.log('\nExample:');
  console.log(`INSERT INTO users (..., password, ...) VALUES (..., '${hash}', ...);`);
}

generateHashes();