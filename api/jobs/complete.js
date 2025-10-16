// Complete GPU job and commit to blockchain

import { commitJobReceipt, generateIdempotencyKey } from '../../lib/numbers.js';
import { saveJobReceipt } from '../../lib/db.js';
import { simulateJobCompletion, generateMockArtifact } from '../../lib/gpu-simulator.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId, taskType, estimatedDuration, executor } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    // Simulate job completion
    const completionData = simulateJobCompletion(jobId, taskType, estimatedDuration || 60);
    const artifact = generateMockArtifact(jobId, taskType);
    const idempotencyKey = generateIdempotencyKey(jobId, 'JobCompleted');

    // Prepare metadata for blockchain
    const metadata = {
      jobId,
      taskType,
      outputHash: completionData.outputHash,
      outputCid: completionData.outputCid,
      duration: completionData.duration,
      gpuUtilization: completionData.gpuUtilization,
      exitCode: completionData.exitCode,
      status: 'completed',
      artifact: {
        fileName: artifact.fileName,
        fileHash: artifact.fileHash,
        fileSize: artifact.fileSize,
        mimeType: artifact.mimeType
      }
    };

    // Commit to blockchain via Numbers Protocol
    const blockchainReceipt = await commitJobReceipt({
      eventType: 'JobCompleted',
      jobId,
      taskType,
      executor: executor || 'system',
      occurredAt: completionData.completedAt,
      metadata,
      idempotencyKey
    });

    // Save to database (handle duplicate idempotency key)
    let dbReceipt;
    try {
      dbReceipt = await saveJobReceipt({
      idempotencyKey,
      jobId,
      eventType: 'JobCompleted',
      taskType,
      executor: executor || 'system',
      occurredAt: new Date(completionData.completedAt),
      metadataJson: JSON.stringify(metadata),
      outputHash: completionData.outputHash,
      duration: completionData.duration,
      gpuUtilization: completionData.gpuUtilization,
      txHash: blockchainReceipt.proofHash, // Use proof_hash instead of workflow ID
      nid: blockchainReceipt.nid,
      chain: 'numbers-mainnet'
      });
    } catch (dbError) {
      // Check for unique constraint violation (duplicate idempotency key)
      if (dbError.code === 'P2002' && dbError.meta?.target?.includes('idempotencyKey')) {
        return res.status(409).json({
          error: 'Duplicate submission',
          message: 'This job has already been completed',
          idempotencyKey
        });
      }
      throw dbError;
    }

    res.status(200).json({
      success: true,
      jobId,
      eventType: 'JobCompleted',
      receipt: {
        id: dbReceipt.id,
        nid: blockchainReceipt.nid,
        txHash: blockchainReceipt.txHash,
        explorerUrl: blockchainReceipt.explorerUrl
      },
      completionData,
      artifact,
      message: 'Job completed successfully and committed to blockchain'
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ 
      error: 'Failed to complete job', 
      details: error.message 
    });
  }
}
