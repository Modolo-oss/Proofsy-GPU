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

export function generateJsonArtifact(jobId, taskType, executor, executionData) {
  const baseArtifact = {
    jobId,
    taskType,
    executedAt: new Date().toISOString(),
    executor,
    
    // Mock GPU result based on task type
    result: generateTaskSpecificResult(taskType),
    
    // GPU execution info
    execution: {
      gpuType: executionData.gpuType || 'NVIDIA A100 80GB',
      duration: executionData.duration || 45.2,
      gpuUtilization: executionData.gpuUtilization || '87%',
      memoryUsed: `${Math.floor(Math.random() * 20) + 30}GB`,
      exitCode: 0
    },
    
    // Hashes
    hashes: {
      inputHash: `QmInput${Math.random().toString(36).substr(2, 32)}`,
      outputHash: `sha256:${Math.random().toString(16).substr(2, 64)}`
    }
  };

  return baseArtifact;
}

function generateTaskSpecificResult(taskType) {
  switch (taskType) {
    case 'stable-diffusion':
      return {
        prompt: "beautiful sunset over mountains",
        model: "stable-diffusion-xl-1.0",
        steps: 50,
        cfg_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        outputDescription: "High quality image generated with realistic lighting",
        imageUrl: `ipfs://QmMockOutput${Math.random().toString(36).substr(2, 32)}`
      };
    
    case 'llm-inference':
      return {
        prompt: "Explain quantum computing in simple terms",
        model: "gpt-4",
        maxTokens: 500,
        temperature: 0.7,
        response: "Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, allowing for parallel processing that could solve certain problems exponentially faster than classical computers.",
        tokensUsed: 247,
        finishReason: "stop"
      };
    
    case 'model-training':
      return {
        dataset: "custom-dataset-v1.2",
        model: "resnet-50",
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        finalAccuracy: 0.942,
        loss: 0.089,
        modelUrl: `ipfs://QmModel${Math.random().toString(36).substr(2, 32)}`
      };
    
    case 'video-upscaling':
      return {
        inputResolution: "1920x1080",
        outputResolution: "3840x2160",
        algorithm: "ESRGAN",
        upscaleFactor: 2,
        processingTime: 180.5,
        videoUrl: `ipfs://QmVideo${Math.random().toString(36).substr(2, 32)}`
      };
    
    case 'speech-synthesis':
      return {
        text: "Hello, this is a speech synthesis test",
        voice: "alloy",
        language: "en-US",
        audioFormat: "mp3",
        duration: 3.2,
        audioUrl: `ipfs://QmAudio${Math.random().toString(36).substr(2, 32)}`
      };
    
    default:
      return {
        task: taskType,
        status: "completed",
        outputDescription: "Mock GPU output for demo purposes"
      };
  }
}
