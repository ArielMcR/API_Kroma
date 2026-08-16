require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.test'), override: true });
const { execSync } = require('child_process');

execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', {
    stdio: 'inherit',
    env: process.env,
});
