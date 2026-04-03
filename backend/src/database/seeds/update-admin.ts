import dataSource from '../../config/data-source.js';
import * as bcrypt from 'bcrypt';

async function updateAdmin() {
  await dataSource.initialize();
  const hash = await bcrypt.hash('1234', 12);
  await dataSource.query(
    `UPDATE usuario SET nombre = $1, email = $2, password = $3 WHERE id = 1`,
    ['Admin', 'admin', hash],
  );
  console.log('Admin updated: login=admin, password=1234');
  await dataSource.destroy();
}

updateAdmin().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
