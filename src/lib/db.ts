import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prismaRaw: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/lagerist.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl.replace(/^file:/, "") });

// Unfiltered client — sees draft rows (confirmed: false) too. Only code
// that has to tell drafts apart from missing rows should import this: the
// draft lifecycle (lib/drafts.ts, lib/draft-cleanup.ts), save conflict
// checks (lib/versioning.ts), uploads and the cleanup page (lib/orphans.ts).
// Everything else should use the default export below.
export const prismaRaw = globalForPrisma.prismaRaw ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaRaw = prismaRaw;
}

function withConfirmedFilter<Args extends { where?: object }>(args: Args): Args {
  return { ...args, where: { ...args.where, confirmed: true } };
}

type FilterableArgs = { where?: object };
type NextQuery = (args: FilterableArgs) => unknown;
const filterReads = {
  findMany: ({ args, query }: { args: FilterableArgs; query: NextQuery }) => query(withConfirmedFilter(args)),
  findFirst: ({ args, query }: { args: FilterableArgs; query: NextQuery }) => query(withConfirmedFilter(args)),
  findFirstOrThrow: ({ args, query }: { args: FilterableArgs; query: NextQuery }) =>
    query(withConfirmedFilter(args)),
  findUnique: ({ args, query }: { args: FilterableArgs; query: NextQuery }) => query(withConfirmedFilter(args)),
  findUniqueOrThrow: ({ args, query }: { args: FilterableArgs; query: NextQuery }) =>
    query(withConfirmedFilter(args)),
  count: ({ args, query }: { args: FilterableArgs; query: NextQuery }) => query(withConfirmedFilter(args)),
};

// Default client for all normal reads: silently excludes draft rows
// (confirmed: false) from Location/Container/Item — the row a "New" page
// creates up front so attachment upload has a real id before the form is
// submitted (see lib/drafts.ts). Applied only to read methods; create/
// update/delete are left alone — confirming a draft means updating a row
// that currently has confirmed: false, through this same client.
export const prisma = prismaRaw.$extends({
  name: "exclude-drafts",
  query: {
    location: filterReads,
    container: filterReads,
    item: filterReads,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
}) as unknown as PrismaClient;
