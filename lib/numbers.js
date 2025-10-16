// Numbers Protocol Integration for GPU Job Receipts

const NUMBERS_CONFIG = {
  apiBase: process.env.NUMBERS_API_BASE || 'https://api.numbersprotocol.io/api/v3',
  apiKey: process.env.NUMBERS_API_KEY,
  commitPath: '/assets/',
  explorerBase: process.env.EXPLORER_ASSET_BASE || 'https://verify.numbersprotocol.io/asset-profile/'
};

export async function commitJobReceipt(jobData) {
  if (!NUMBERS_CONFIG.apiKey) {
    throw new Error('NUMBERS_API_KEY not configured');
  }

  const capturePayload = {
    data: {
      eventType: jobData.eventType,
      jobId: jobData.jobId,
      taskType: jobData.taskType,
      executor: jobData.executor,
      occurredAt: jobData.occurredAt,
      metadata: jobData.metadata,
      idempotencyKey: jobData.idempotencyKey
    },
    source: {
      id: `gpu-job-${jobData.jobId}`,
      name: 'ProofsyGPU - GPU Job Receipt System'
    }
  };

  const response = await fetch(NUMBERS_CONFIG.apiBase + NUMBERS_CONFIG.commitPath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${NUMBERS_CONFIG.apiKey}`
    },
    body: JSON.stringify(capturePayload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Numbers API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  
  return {
    nid: result.nid,
    txHash: result.post_creation_workflow_id || result.transaction_hash,
    explorerUrl: NUMBERS_CONFIG.explorerBase + result.nid
  };
}

export function generateIdempotencyKey(jobId, eventType) {
  // Deterministic key: prevents duplicate commits for same job+event
  return `gpu-job-${jobId}-${eventType}`;
}
