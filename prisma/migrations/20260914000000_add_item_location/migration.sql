-- Items can now also live directly in a Location (not just in a Container).
-- Written by hand (not via `prisma migrate dev`) because that command's shadow-db
-- diff would try to drop the hand-added `search_index` FTS5 table, which isn't
-- modeled in schema.prisma. Applied with `prisma migrate deploy`, which just
-- runs migration files in order without diffing.
ALTER TABLE "Item" ADD COLUMN "locationId" TEXT REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Item_locationId_idx" ON "Item"("locationId");
