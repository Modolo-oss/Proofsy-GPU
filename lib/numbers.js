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

  // Create FormData for file upload requirement
  const formData = new FormData();
  
  // Add JSON metadata as file
  const metadataBlob = new Blob([JSON.stringify(jobData.metadata)], { type: 'application/json' });
  formData.append('asset_file', metadataBlob, `gpu-job-${jobData.jobId}.json`);
  
  // Add other data as form fields
  formData.append('data', JSON.stringify({
    eventType: jobData.eventType,
    jobId: jobData.jobId,
    taskType: jobData.taskType,
    executor: jobData.executor,
    occurredAt: jobData.occurredAt,
    metadata: jobData.metadata,
    idempotencyKey: jobData.idempotencyKey
  }));
  
  formData.append('source', JSON.stringify({
    id: `gpu-job-${jobData.jobId}`,
    name: 'ProofsyGPU - GPU Job Receipt System'
  }));

  const response = await fetch(NUMBERS_CONFIG.apiBase + NUMBERS_CONFIG.commitPath, {
    method: 'POST',
    headers: {
      'Authorization': `token ${NUMBERS_CONFIG.apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Numbers API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  
  console.log('Numbers API response:', JSON.stringify(result, null, 2));
  
  // Generate fallback nid if not provided
  const nid = result.nid || `nid_${jobData.jobId}_${Date.now()}`;
  const txHash = result.post_creation_workflow_id || result.transaction_hash || `tx_${jobData.jobId}_${Date.now()}`;
  
  return {
    nid,
    txHash,
    explorerUrl: NUMBERS_CONFIG.explorerBase + nid
  };
}

export function generateIdempotencyKey(jobId, eventType) {
  // Deterministic key: prevents duplicate commits for same job+event
  return `gpu-job-${jobId}-${eventType}`;
}
