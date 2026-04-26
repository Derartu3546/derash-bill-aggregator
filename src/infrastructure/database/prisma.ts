import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the .env file");
}
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
