-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "Node" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL DEFAULT 'LESSON',
    "label" TEXT NOT NULL,
    "content_hash" TEXT,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "last_verified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "properties" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "memory_tier" TEXT NOT NULL DEFAULT 'ACTIVE',
    "embedding" vector(3072),
    "embeddingModel" TEXT,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "color" TEXT NOT NULL DEFAULT '#818cf8',
    "virtual_clock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeTag" (
    "nodeId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "accessed_at_virtual_day" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeTag_pkey" PRIMARY KEY ("nodeId","tagId")
);

-- CreateTable
CREATE TABLE "Archive" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fromNodeId" UUID NOT NULL,
    "toNodeId" UUID NOT NULL,
    "reason" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueTask" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nodeId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerRepo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexerRepo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerFile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "repoId" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "IndexerFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerSymbol" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "range" TEXT NOT NULL,

    CONSTRAINT "IndexerSymbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerDependency" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dependentFileId" UUID NOT NULL,
    "dependencyFileId" UUID NOT NULL,
    "symbolName" TEXT,

    CONSTRAINT "IndexerDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Node_memory_tier_idx" ON "Node"("memory_tier");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_scope_name_version_key" ON "Tag"("scope", "name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerRepo_name_key" ON "IndexerRepo"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerFile_repoId_path_key" ON "IndexerFile"("repoId", "path");

-- CreateIndex
CREATE INDEX "IndexerDependency_dependentFileId_idx" ON "IndexerDependency"("dependentFileId");

-- CreateIndex
CREATE INDEX "IndexerDependency_dependencyFileId_idx" ON "IndexerDependency"("dependencyFileId");

-- AddForeignKey
ALTER TABLE "NodeTag" ADD CONSTRAINT "NodeTag_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeTag" ADD CONSTRAINT "NodeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexerFile" ADD CONSTRAINT "IndexerFile_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "IndexerRepo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexerSymbol" ADD CONSTRAINT "IndexerSymbol_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "IndexerFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexerDependency" ADD CONSTRAINT "IndexerDependency_dependentFileId_fkey" FOREIGN KEY ("dependentFileId") REFERENCES "IndexerFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexerDependency" ADD CONSTRAINT "IndexerDependency_dependencyFileId_fkey" FOREIGN KEY ("dependencyFileId") REFERENCES "IndexerFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
