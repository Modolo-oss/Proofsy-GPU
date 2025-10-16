// Database helper for Vercel Postgres

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function saveJobReceipt(receiptData) {
  return await prisma.jobReceipt.create({
    data: receiptData
  });
}

export async function getJobTimeline(jobId) {
  const receipts = await prisma.jobReceipt.findMany({
    where: { jobId },
    orderBy: { occurredAt: 'asc' }
  });
  
  return receipts.map(receipt => ({
    ...receipt,
    metadata: JSON.parse(receipt.metadataJson),
    explorerUrl: `https://verify.numbersprotocol.io/asset-profile/${receipt.nid}`
  }));
}

export async function getAllJobs() {
  const receipts = await prisma.jobReceipt.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  
  // Group by jobId
  const jobsMap = {};
  receipts.forEach(receipt => {
    if (!jobsMap[receipt.jobId]) {
      jobsMap[receipt.jobId] = {
        jobId: receipt.jobId,
        taskType: receipt.taskType,
        executor: receipt.executor,
        events: []
      };
    }
    jobsMap[receipt.jobId].events.push({
      eventType: receipt.eventType,
      nid: receipt.nid,
      occurredAt: receipt.occurredAt,
      metadata: JSON.parse(receipt.metadataJson)
    });
  });
  
  return Object.values(jobsMap);
}
