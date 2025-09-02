import pg from 'pg';
import { Sequelize, Dialect, Options } from 'sequelize';

import SessionFactory from './session';
import UserFactory from './user';

const database = process.env.DB_NAME || 'meetapp';
const username = process.env.DB_USER || 'admin';
const password = process.env.DB_PASSWORD || 'admin';
const host = process.env.DB_HOST || 'db';
const dialect = (process.env.DB_DIALECT as Dialect) || 'postgres';

const sequelizeOptions: Options = {
  host,
  dialect,
  dialectModule: dialect === 'postgres' ? pg : undefined,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
};

const sequelize = new Sequelize(database, username, password, sequelizeOptions);

// Explicitly initialize models
const Session = SessionFactory(sequelize);
const User = UserFactory(sequelize);

const db = {
  sequelize,
  Sequelize,
  Session,
  User,
  // Add other models here
};

export default db;
db.Sequelize = Sequelize;
