// run migrations
import { execSync } from 'child_process';

import db from '@/app/server/db/models';

beforeAll(() => {
  execSync('npx sequelize-cli db:migrate --env test');
});

afterAll(async () => {
  await db.sequelize.close();
  execSync('npx sequelize-cli db:migrate:undo:all --env test');
});
