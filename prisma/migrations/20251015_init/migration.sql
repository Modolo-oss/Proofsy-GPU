-- CreateTable
CREATE TABLE "JobReceipt" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "executor" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadataJson" TEXT NOT NULL,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "gpuType" TEXT,
    "duration" DOUBLE PRECISION,
    "gpuUtilization" TEXT,
    "txHash" TEXT NOT NULL,
    "nid" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'numbers-mainnet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobArtifact" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "fileHash" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "c2paSignature" TEXT,
    "captureCid" TEXT,
    "captureTxHash" TEXT,
    "captureNid" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobReceipt_idempotencyKey_key" ON "JobReceipt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "JobReceipt_jobId_idx" ON "JobReceipt"("jobId");

-- CreateIndex
CREATE INDEX "JobReceipt_nid_idx" ON "JobReceipt"("nid");

-- CreateIndex
CREATE INDEX "JobReceipt_eventType_idx" ON "JobReceipt"("eventType");

-- CreateIndex
CREATE INDEX "JobArtifact_jobId_idx" ON "JobArtifact"("jobId");

-- CreateIndex
CREATE INDEX "JobArtifact_captureCid_idx" ON "JobArtifact"("captureCid");
