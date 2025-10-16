// Complete GPU job and commit to blockchain

import { commitJobReceipt, generateIdempotencyKey } from '../../lib/numbers.js';
import { saveJobReceipt, getJobTimeline } from '../../lib/db.js';
import { simulateJobCompletion, generateMockArtifact, generateJsonArtifact } from '../../lib/gpu-simulator.js';
import { signArtifactWithC2PA, generateKeyPair } from '../../lib/c2pa-signer.js';

// Helper function to get task name for consistency
function getTaskName(taskType) {
  const taskNames = {
    'stable-diffusion': 'Stable Diffusion Image Generation',
    'llm-inference': 'LLM Text Inference',
    'model-training': 'Model Fine-tuning',
    'video-upscaling': 'AI Video Upscaling',
    'speech-synthesis': 'Speech-to-Text Transcription'
  };
  return taskNames[taskType] || taskType;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId, taskType, estimatedDuration, executor } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    // Get submitted event from timeline to extract blockchain proof
    const timeline = await getJobTimeline(jobId);
    const submittedEvent = timeline.find(event => event.eventType === 'JobSubmitted');
    
    if (!submittedEvent) {
      return res.status(404).json({ error: 'Job submission not found' });
    }

    // Simulate job completion
    const completionData = simulateJobCompletion(jobId, taskType, estimatedDuration || 60);
    
    // Get consistent GPU type from submitted event
    const consistentGpuType = submittedEvent.metadata?.gpuType || completionData.gpuType;
    
    // Generate JSON artifact with detailed results
    const jsonArtifact = generateJsonArtifact(
      jobId, 
      taskType, 
      executor || 'system',
      completionData,
      consistentGpuType
    );
    
    // Generate signing key pair (in production, use a secure key management system)
    const keyPair = generateKeyPair();
    
    // Prepare blockchain proof from submitted event
    const blockchainProof = {
      submittedNid: submittedEvent.nid,
      completedNid: null, // Will be set after blockchain commit
      explorerUrl: submittedEvent.metadata?.blockchainReceipt?.explorerUrl,
      proofHash: submittedEvent.txHash
    };
    
    // Sign JSON artifact with C2PA
    const signedArtifact = signArtifactWithC2PA(
      jsonArtifact, 
      blockchainProof, 
      keyPair.privateKey
    );
    
    // Save signed artifact to file system (in production, use cloud storage)
    const artifactPath = `/artifacts/${jobId}_result.json`;
    const artifactContent = JSON.stringify(signedArtifact, null, 2);
    
    // Generate mock artifact for compatibility
    const artifact = generateMockArtifact(jobId, taskType);
    const idempotencyKey = generateIdempotencyKey(jobId, 'JobCompleted');

    // Prepare metadata for blockchain with C2PA info
    const metadata = {
      jobId,
      taskType,
      taskName: getTaskName(taskType),
      gpuType: submittedEvent.metadata?.gpuType || completionData.gpuType || 'NVIDIA A100 80GB', // Use same GPU as submitted
      executor: executor || 'system',
      outputHash: completionData.outputHash,
      outputCid: completionData.outputCid,
      duration: completionData.duration,
      gpuUtilization: completionData.gpuUtilization,
      exitCode: completionData.exitCode,
      status: 'completed',
      
      // C2PA Artifact info
      artifact: {
        type: 'json',
        path: artifactPath,
        size: Buffer.byteLength(artifactContent, 'utf8'),
        c2paSigned: true,
        c2paManifest: true,
        publicKey: keyPair.publicKey,
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

    // Update blockchain proof with completed NID
    blockchainProof.completedNid = blockchainReceipt.nid;
    blockchainProof.proofHash = blockchainReceipt.proofHash;
    
    // Re-sign artifact with complete blockchain proof
    const finalSignedArtifact = signArtifactWithC2PA(
      jsonArtifact, 
      blockchainProof, 
      keyPair.privateKey
    );
    
    // Save final signed artifact
    const finalArtifactContent = JSON.stringify(finalSignedArtifact, null, 2);

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
        metadataJson: JSON.stringify({
          ...metadata,
          c2paArtifact: {
            content: finalArtifactContent,
            path: artifactPath,
            size: Buffer.byteLength(finalArtifactContent, 'utf8')
          }
        }),
        outputHash: completionData.outputHash,
        duration: completionData.duration,
        gpuUtilization: completionData.gpuUtilization,
        txHash: blockchainReceipt.proofHash,
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
      artifact: {
        type: 'json',
        path: artifactPath,
        size: Buffer.byteLength(finalArtifactContent, 'utf8'),
        c2paSigned: true,
        downloadUrl: `/api/artifacts/download/${jobId}_result.json`
      },
      message: 'Job completed with C2PA-signed artifact and committed to blockchain'
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ 
      error: 'Failed to complete job', 
      details: error.message 
    });
  }
}
