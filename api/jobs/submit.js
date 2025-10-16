// Submit new GPU job and commit to blockchain

import { commitJobReceipt, generateIdempotencyKey } from '../../lib/numbers.js';
import { saveJobReceipt } from '../../lib/db.js';
import { simulateJobSubmission } from '../../lib/gpu-simulator.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskType, executor, autoComplete } = req.body;

    if (!taskType) {
      return res.status(400).json({ error: 'taskType is required' });
    }

    // Simulate job submission
    const jobData = simulateJobSubmission(taskType, executor);
    const idempotencyKey = generateIdempotencyKey(jobData.jobId, 'JobSubmitted');

    // Prepare metadata for blockchain
    const metadata = {
      jobId: jobData.jobId,
      taskType: jobData.taskType,
      taskName: jobData.taskName,
      gpuType: jobData.gpuType,
      estimatedDuration: jobData.estimatedDuration,
      inputHash: jobData.inputHash,
      executor: jobData.executor,
      status: 'submitted'
    };

    // Commit to blockchain via Numbers Protocol
    const blockchainReceipt = await commitJobReceipt({
      eventType: 'JobSubmitted',
      jobId: jobData.jobId,
      taskType: jobData.taskType,
      executor: jobData.executor,
      occurredAt: jobData.submittedAt,
      metadata,
      idempotencyKey
    });

    // Merge Numbers API metadata with job metadata
    const completeMetadata = {
      ...metadata,
      // Numbers API metadata
      assetCid: blockchainReceipt.nid,
      assetSha256: blockchainReceipt.assetSha256,
      creatorWallet: blockchainReceipt.creatorWallet,
      encodingFormat: 'application/json',
      assetTimestampCreated: Math.floor(Date.now() / 1000),
      assetCreator: 'proofsy-gpu-system',
      assetSourceType: 'gpu-compute-job'
    };

    // Save to database (handle duplicate idempotency key)
    let dbReceipt;
    try {
      dbReceipt = await saveJobReceipt({
      idempotencyKey,
      jobId: jobData.jobId,
      eventType: 'JobSubmitted',
      taskType: jobData.taskType,
      executor: jobData.executor,
      occurredAt: new Date(jobData.submittedAt),
      metadataJson: JSON.stringify(completeMetadata),
      inputHash: jobData.inputHash,
      gpuType: jobData.gpuType,
      txHash: blockchainReceipt.txHash,
      nid: blockchainReceipt.nid,
      chain: 'numbers-mainnet'
      });
    } catch (dbError) {
      // Check for unique constraint violation (duplicate idempotency key)
      if (dbError.code === 'P2002' && dbError.meta?.target?.includes('idempotencyKey')) {
        return res.status(409).json({
          error: 'Duplicate submission',
          message: 'This job has already been submitted',
          idempotencyKey
        });
      }
      throw dbError;
    }

    res.status(200).json({
      success: true,
      jobId: jobData.jobId,
      eventType: 'JobSubmitted',
      receipt: {
        id: dbReceipt.id,
        nid: blockchainReceipt.nid,
        txHash: blockchainReceipt.txHash,
        explorerUrl: blockchainReceipt.explorerUrl
      },
      jobData,
      message: 'Job submitted successfully and committed to blockchain'
    });
  } catch (error) {
    console.error('Error submitting job:', error);
    res.status(500).json({ 
      error: 'Failed to submit job', 
      details: error.message 
    });
  }
}
