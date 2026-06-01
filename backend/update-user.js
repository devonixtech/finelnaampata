const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'testvendor@naampata.com' },
    data: {
      role: 'vendor',
      isEmailVerified: true
    }
  });
  console.log('User updated to vendor and verified');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
