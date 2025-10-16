// Mock GPU Job Simulator

const GPU_TYPES = [
  'NVIDIA A100 80GB',
  'NVIDIA H100 SXM',
  'NVIDIA RTX 4090',
  'AMD MI300X',
  'Google TPU v5e'
];

const TASK_TYPES = [
  { id: 'stable-diffusion', name: 'Stable Diffusion Image Generation', avgDuration: 45 },
  { id: 'llm-inference', name: 'LLM Text Inference', avgDuration: 12 },
  { id: 'model-training', name: 'Model Fine-tuning', avgDuration: 300 },
  { id: 'video-upscaling', name: 'AI Video Upscaling', avgDuration: 180 },
  { id: 'speech-synthesis', name: 'Speech-to-Text Transcription', avgDuration: 30 }
];

export function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getTaskTypes() {
  return TASK_TYPES;
}

export function simulateJobSubmission(taskType, executor) {
  const task = TASK_TYPES.find(t => t.id === taskType) || TASK_TYPES[0];
  const gpuType = GPU_TYPES[Math.floor(Math.random() * GPU_TYPES.length)];
  
  return {
    jobId: generateJobId(),
    taskType: task.id,
    taskName: task.name,
    executor: executor || `0x${Math.random().toString(16).substr(2, 40)}`,
    gpuType,
    estimatedDuration: task.avgDuration,
    inputHash: `QmInput${Math.random().toString(36).substr(2, 32)}`,
    status: 'submitted',
    submittedAt: new Date().toISOString()
  };
}

export function simulateJobCompletion(jobId, taskType, estimatedDuration) {
  const actualDuration = estimatedDuration * (0.8 + Math.random() * 0.4); // ±20% variation
  const gpuUtilization = 70 + Math.floor(Math.random() * 25); // 70-95%
  
  return {
    jobId,
    outputHash: `QmOutput${Math.random().toString(36).substr(2, 32)}`,
    outputCid: `bafybeig${Math.random().toString(36).substr(2, 48)}`,
    duration: Math.round(actualDuration * 10) / 10,
    gpuUtilization: `${gpuUtilization}%`,
    gpuType: GPU_TYPES[Math.floor(Math.random() * GPU_TYPES.length)], // Add gpuType
    exitCode: 0,
    status: 'completed',
    completedAt: new Date().toISOString()
  };
}

export function generateMockArtifact(jobId, taskType) {
  const artifactTypes = {
    'stable-diffusion': { ext: 'png', mime: 'image/png', size: 2048000 },
    'llm-inference': { ext: 'json', mime: 'application/json', size: 4096 },
    'model-training': { ext: 'pt', mime: 'application/octet-stream', size: 524288000 },
    'video-upscaling': { ext: 'mp4', mime: 'video/mp4', size: 104857600 },
    'speech-synthesis': { ext: 'json', mime: 'application/json', size: 8192 }
  };
  
  const artifact = artifactTypes[taskType] || artifactTypes['llm-inference'];
  
  return {
    fileName: `${jobId}_output.${artifact.ext}`,
    mimeType: artifact.mime,
    fileSize: artifact.size,
    fileHash: `sha256:${Math.random().toString(16).substr(2, 64)}`
  };
}
