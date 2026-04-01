import dataSource from '../../config/data-source.js';
import { seedPlanes } from './planes.seed.js';

async function runSeeds() {
  await dataSource.initialize();
  console.log('Database connected. Running seeds...');

  await seedPlanes(dataSource);

  await dataSource.destroy();
  console.log('Seeds completed. Connection closed.');
}

runSeeds().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
