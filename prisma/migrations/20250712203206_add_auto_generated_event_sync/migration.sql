-- CreateTable
CREATE TABLE "auto_generated_event_syncs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalEventId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "auto_generated_event_syncs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "auto_generated_event_syncs_originalEventId_userId_idx" ON "auto_generated_event_syncs"("originalEventId", "userId");

-- CreateIndex
CREATE INDEX "auto_generated_event_syncs_userId_idx" ON "auto_generated_event_syncs"("userId");

-- CreateIndex
CREATE INDEX "auto_generated_event_syncs_isDeleted_idx" ON "auto_generated_event_syncs"("isDeleted");

-- CreateIndex
CREATE INDEX "auto_generated_event_syncs_date_idx" ON "auto_generated_event_syncs"("date");
