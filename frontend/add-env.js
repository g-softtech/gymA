const fs = require('fs');

const envPath = '.env';
let envContent = fs.readFileSync(envPath, 'utf8');

if (!envContent.includes('SUPERADMIN_USER_ID=')) {
  envContent += '\n# Platform Owner (Immutable Identity)\nSUPERADMIN_USER_ID=cmqerk34n000004jpguk4jlos\n';
  fs.writeFileSync(envPath, envContent);
  console.log('Added to .env');
} else {
  console.log('Already exists in .env');
}
