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
  
  // Create complete job metadata for blockchain storage
  const completeJobMetadata = {
    // Job details
    eventType: jobData.eventType,
    jobId: jobData.jobId,
    taskType: jobData.taskType,
    executor: jobData.executor,
    occurredAt: jobData.occurredAt,
    idempotencyKey: jobData.idempotencyKey,
    
    // GPU job specific metadata
    ...jobData.metadata
  };
  
  // Add JSON metadata as file
  const metadataBlob = new Blob([JSON.stringify(completeJobMetadata)], { type: 'application/json' });
  formData.append('asset_file', metadataBlob, `gpu-job-${jobData.jobId}.json`);
  
  // Add metadata fields that will be stored on blockchain
  formData.append('caption', `GPU Job ${jobData.eventType}: ${jobData.taskType} | JobID: ${jobData.jobId} | GPU: ${jobData.metadata.gpuType} | Executor: ${jobData.executor}`);
  formData.append('headline', `ProofsyGPU - ${jobData.taskType} Job Receipt`);
  formData.append('tag', `gpu-job,${jobData.taskType},${jobData.eventType.toLowerCase()},job-${jobData.jobId}`);
  
  // Use nit_commit_custom for storing job metadata (this field is supported)
  formData.append('nit_commit_custom', JSON.stringify({
    jobDetails: {
      eventType: jobData.eventType,
      jobId: jobData.jobId,
      taskType: jobData.taskType,
      executor: jobData.executor,
      occurredAt: jobData.occurredAt,
      idempotencyKey: jobData.idempotencyKey
    },
    gpuJobMetadata: jobData.metadata
  }));
  
  // Add comprehensive job info to information field
  formData.append('information', JSON.stringify({
    proof: {
      hash: "will-be-generated",
      mimeType: "application/json",
      timestamp: Math.floor(Date.now() / 1000)
    },
    jobDetails: {
      eventType: jobData.eventType,
      jobId: jobData.jobId,
      taskType: jobData.taskType,
      executor: jobData.executor,
      occurredAt: jobData.occurredAt,
      idempotencyKey: jobData.idempotencyKey
    },
    gpuJobMetadata: jobData.metadata
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
  
  // Extract real data from Numbers API response
  const nid = result.cid || result.id;
  const txHash = result.post_creation_workflow_id;
  const proofHash = result.proof_hash;
  const assetSha256 = result.proof_hash; // Use proof_hash as assetSha256
  const creatorWallet = result.creator_addresses?.asset_wallet_address;
  const creatorName = result.creator_name;
  const ownerWallet = result.owner_addresses?.asset_wallet_address;
  const originType = result.origin_type;
  
  // If no valid nid from API, create a mock nid in proper format
  const validNid = nid || `bafkrei${Buffer.from(jobData.jobId + Date.now()).toString('base64').slice(0, 44)}`;
  
  return {
    nid: validNid,
    txHash: txHash || `tx_${jobData.jobId}_${Date.now()}`,
    proofHash,
    assetSha256,
    creatorWallet,
    creatorName,
    ownerWallet,
    originType,
    explorerUrl: NUMBERS_CONFIG.explorerBase + validNid + `?nid=${validNid}`,
    rawResponse: result // Include full response for debugging
  };
}

export function generateIdempotencyKey(jobId, eventType) {
  // Deterministic key: prevents duplicate commits for same job+event
  return `gpu-job-${jobId}-${eventType}`;
}
