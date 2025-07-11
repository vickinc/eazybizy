-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_calendar_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "company" TEXT,
    "participants" TEXT NOT NULL DEFAULT '',
    "companyId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "googleEventId" TEXT,
    "googleCalendarId" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'LOCAL',
    "lastSyncedAt" DATETIME,
    "googleEtag" TEXT,
    "location" TEXT,
    "endTime" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "createdByUserId" TEXT,
    "timezoneId" TEXT NOT NULL DEFAULT 'UTC',
    "eventScope" TEXT NOT NULL DEFAULT 'personal',
    CONSTRAINT "calendar_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "calendar_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_calendar_events" ("company", "companyId", "createdAt", "createdByUserId", "date", "description", "endTime", "googleCalendarId", "googleEtag", "googleEventId", "id", "isAllDay", "lastSyncedAt", "location", "participants", "priority", "recurrence", "syncStatus", "time", "timezoneId", "title", "type", "updatedAt") SELECT "company", "companyId", "createdAt", "createdByUserId", "date", "description", "endTime", "googleCalendarId", "googleEtag", "googleEventId", "id", "isAllDay", "lastSyncedAt", "location", "participants", "priority", "recurrence", "syncStatus", "time", "timezoneId", "title", "type", "updatedAt" FROM "calendar_events";
DROP TABLE "calendar_events";
ALTER TABLE "new_calendar_events" RENAME TO "calendar_events";
CREATE UNIQUE INDEX "calendar_events_googleEventId_key" ON "calendar_events"("googleEventId");
CREATE INDEX "calendar_events_createdAt_id_idx" ON "calendar_events"("createdAt", "id");
CREATE INDEX "calendar_events_date_createdAt_id_idx" ON "calendar_events"("date", "createdAt", "id");
CREATE INDEX "calendar_events_type_createdAt_id_idx" ON "calendar_events"("type", "createdAt", "id");
CREATE INDEX "calendar_events_priority_createdAt_id_idx" ON "calendar_events"("priority", "createdAt", "id");
CREATE INDEX "calendar_events_companyId_createdAt_id_idx" ON "calendar_events"("companyId", "createdAt", "id");
CREATE INDEX "calendar_events_date_type_createdAt_id_idx" ON "calendar_events"("date", "type", "createdAt", "id");
CREATE INDEX "calendar_events_companyId_date_createdAt_id_idx" ON "calendar_events"("companyId", "date", "createdAt", "id");
CREATE INDEX "calendar_events_type_idx" ON "calendar_events"("type");
CREATE INDEX "calendar_events_priority_idx" ON "calendar_events"("priority");
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");
CREATE INDEX "calendar_events_googleEventId_idx" ON "calendar_events"("googleEventId");
CREATE INDEX "calendar_events_syncStatus_idx" ON "calendar_events"("syncStatus");
CREATE INDEX "calendar_events_createdByUserId_idx" ON "calendar_events"("createdByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
