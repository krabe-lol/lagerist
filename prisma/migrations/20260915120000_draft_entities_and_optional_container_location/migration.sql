-- Draft-entity support (see lib/db.ts confirmed-filtering client): a "New"
-- page silently creates a real row up front so attachment upload has a
-- usable id before the form is actually submitted. `confirmed` defaults to
-- true so existing rows (and this migration itself) are unaffected; only
-- the draft-creation code path explicitly sets it to false.
ALTER TABLE "Location" ADD COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Item" ADD COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT true;

-- Container.locationId also becomes nullable, so a draft Container can
-- exist before a Raum has been chosen for it (only "New Container" without
-- a preset room needs this — SQLite can't just relax a NOT NULL constraint,
-- so the whole table is rebuilt).
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Container" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dimensions" TEXT,
    "volume" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "locationId" TEXT,
    "templateId" TEXT,
    "primaryPhotoId" TEXT,
    CONSTRAINT "Container_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Container_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContainerTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Container_primaryPhotoId_fkey" FOREIGN KEY ("primaryPhotoId") REFERENCES "Attachment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Container" ("id","number","name","description","dimensions","volume","createdAt","updatedAt","locationId","templateId","primaryPhotoId")
SELECT "id","number","name","description","dimensions","volume","createdAt","updatedAt","locationId","templateId","primaryPhotoId" FROM "Container";

DROP TABLE "Container";
ALTER TABLE "new_Container" RENAME TO "Container";

CREATE UNIQUE INDEX "Container_number_key" ON "Container"("number");
CREATE UNIQUE INDEX "Container_primaryPhotoId_key" ON "Container"("primaryPhotoId");
CREATE INDEX "Container_locationId_idx" ON "Container"("locationId");

PRAGMA foreign_keys=ON;
