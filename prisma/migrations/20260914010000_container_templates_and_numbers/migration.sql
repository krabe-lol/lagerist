-- Redesign: templates now only exist for Containers (a fixed name/dimensions/
-- volume preset, e.g. "EzyStorage 18L"), not for Locations/Items. Containers
-- also get a system-assigned running number to tell same-named containers
-- apart. Hand-written (not `prisma migrate dev`) for the same reason as the
-- previous migration: its shadow-db diff would try to drop the hand-added
-- `search_index` FTS5 table.
--
-- Container and Item hold no rows yet in this database, so they're simply
-- dropped and recreated with the new shape. Location has real data, so its
-- table is rebuilt in place, copying over the columns that survive.

PRAGMA foreign_keys=OFF;

DROP TABLE "Container";
DROP TABLE "Item";

CREATE TABLE "ContainerTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dimensions" TEXT,
    "volume" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Carry over existing container templates by name only; their old free-form
-- custom fields don't map onto the new fixed dimensions/volume columns.
INSERT INTO "ContainerTemplate" ("id", "name", "createdAt", "updatedAt")
SELECT "id", "name", "createdAt", "updatedAt" FROM "Template" WHERE "entityType" = 'CONTAINER';

DROP TABLE "Template";

CREATE TABLE "Location_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" TEXT,
    "primaryPhotoId" TEXT,
    CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Location_primaryPhotoId_fkey" FOREIGN KEY ("primaryPhotoId") REFERENCES "Attachment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "Location_new" ("id", "name", "description", "createdAt", "updatedAt", "parentId", "primaryPhotoId")
SELECT "id", "name", "description", "createdAt", "updatedAt", "parentId", "primaryPhotoId" FROM "Location";

DROP TABLE "Location";
ALTER TABLE "Location_new" RENAME TO "Location";

CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");
CREATE UNIQUE INDEX "Location_primaryPhotoId_key" ON "Location"("primaryPhotoId");

CREATE TABLE "Container" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dimensions" TEXT,
    "volume" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "locationId" TEXT NOT NULL,
    "templateId" TEXT,
    "primaryPhotoId" TEXT,
    CONSTRAINT "Container_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Container_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContainerTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Container_primaryPhotoId_fkey" FOREIGN KEY ("primaryPhotoId") REFERENCES "Attachment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Container_number_key" ON "Container"("number");
CREATE UNIQUE INDEX "Container_primaryPhotoId_key" ON "Container"("primaryPhotoId");
CREATE INDEX "Container_locationId_idx" ON "Container"("locationId");

CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "locationId" TEXT,
    "containerId" TEXT,
    "parentItemId" TEXT,
    "primaryPhotoId" TEXT,
    CONSTRAINT "Item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_primaryPhotoId_fkey" FOREIGN KEY ("primaryPhotoId") REFERENCES "Attachment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Item_locationId_idx" ON "Item"("locationId");
CREATE INDEX "Item_containerId_idx" ON "Item"("containerId");
CREATE INDEX "Item_parentItemId_idx" ON "Item"("parentItemId");
CREATE UNIQUE INDEX "Item_primaryPhotoId_key" ON "Item"("primaryPhotoId");

PRAGMA foreign_keys=ON;
