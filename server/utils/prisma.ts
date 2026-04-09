//PRISMA CLIENT
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

import { logger } from './logger';

const adapter = new PrismaPg({ connectionString });
const prismaBase = new PrismaClient({ adapter });

const prisma = prismaBase.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      const result = await query(args);
      const ms = Math.round(performance.now() - start);

      const message = `${model ? model + '.' : ''}${operation}`;
      if (ms > 1000) {
        logger.db(`SLOW QUERY WARNING: ${message} (Potential bottleneck)`, ms);
      } else if (ms > 500) {
        logger.db(`Moderate Query: ${message}`, ms);
      }
      
      return result;
    },
  },
});

export { prisma };