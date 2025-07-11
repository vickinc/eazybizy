-- CreateTable
CREATE TABLE "google_calendar_syncs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "syncType" TEXT NOT NULL DEFAULT 'PULL',
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "google_calendar_syncs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "google_calendar_syncs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "calendar_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "calendar_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_calendar_events" ("company", "companyId", "createdAt", "date", "description", "id", "participants", "priority", "time", "title", "type", "updatedAt") SELECT "company", "companyId", "createdAt", "date", "description", "id", "participants", "priority", "time", "title", "type", "updatedAt" FROM "calendar_events";
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
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "authId" TEXT,
    "googleId" TEXT,
    "googleEmail" TEXT,
    "googleRefreshToken" TEXT,
    "googleAccessToken" TEXT,
    "googleTokenExpiry" DATETIME,
    "googleCalendarId" TEXT,
    "googleSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastGoogleSync" DATETIME,
    "timezoneId" TEXT NOT NULL DEFAULT 'UTC'
);
INSERT INTO "new_users" ("authId", "createdAt", "email", "emailVerified", "fullName", "id", "isActive", "lastLoginAt", "passwordHash", "role", "updatedAt", "username") SELECT "authId", "createdAt", "email", "emailVerified", "fullName", "id", "isActive", "lastLoginAt", "passwordHash", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_authId_key" ON "users"("authId");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_authId_idx" ON "users"("authId");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_googleId_idx" ON "users"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "google_calendar_syncs_userId_idx" ON "google_calendar_syncs"("userId");

-- CreateIndex
CREATE INDEX "google_calendar_syncs_eventId_idx" ON "google_calendar_syncs"("eventId");

-- CreateIndex
CREATE INDEX "google_calendar_syncs_syncType_idx" ON "google_calendar_syncs"("syncType");

-- CreateIndex
CREATE INDEX "google_calendar_syncs_syncStatus_idx" ON "google_calendar_syncs"("syncStatus");

-- CreateIndex
CREATE INDEX "google_calendar_syncs_syncedAt_idx" ON "google_calendar_syncs"("syncedAt");
