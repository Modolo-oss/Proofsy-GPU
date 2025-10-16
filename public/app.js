// ProofsyGPU Frontend Application

const TASK_TYPES = [
  { id: 'stable-diffusion', name: 'Stable Diffusion Image Generation', icon: 'fa-image' },
  { id: 'llm-inference', name: 'LLM Text Inference', icon: 'fa-comment-dots' },
  { id: 'model-training', name: 'Model Fine-tuning', icon: 'fa-brain' },
  { id: 'video-upscaling', name: 'AI Video Upscaling', icon: 'fa-video' },
  { id: 'speech-synthesis', name: 'Speech-to-Text Transcription', icon: 'fa-microphone' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTaskTypes();
  checkSystemStatus();
  loadJobs();
  
  document.getElementById('submitJobBtn').addEventListener('click', submitJob);
  document.getElementById('refreshJobsBtn').addEventListener('click', loadJobs);
});

function loadTaskTypes() {
  const select = document.getElementById('taskTypeSelect');
  TASK_TYPES.forEach(task => {
    const option = document.createElement('option');
    option.value = task.id;
    option.textContent = task.name;
    select.appendChild(option);
  });
}

async function checkSystemStatus() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    document.getElementById('systemStatus').innerHTML = `
      <div class="d-flex justify-content-between mb-1">
        <span>Status:</span>
        <span class="badge bg-success">${data.status}</span>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>Blockchain:</span>
        <span>${data.blockchain}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span>Standard:</span>
        <span>${data.standard}</span>
      </div>
    `;
  } catch (error) {
    // Demo mode - show mock status
    document.getElementById('systemStatus').innerHTML = `
      <div class="d-flex justify-content-between mb-1">
        <span>Status:</span>
        <span class="badge bg-warning">DEMO MODE</span>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>Blockchain:</span>
        <span>Numbers Mainnet</span>
      </div>
      <div class="d-flex justify-content-between">
        <span>Standard:</span>
        <span>ERC-7053</span>
      </div>
      <div class="mt-2 small text-muted">
        <i class="fas fa-info-circle me-1"></i>Preview mode - deploy to Vercel for full functionality
      </div>
    `;
  }
}

async function submitJob() {
  const taskType = document.getElementById('taskTypeSelect').value;
  const executor = document.getElementById('executorInput').value;
  const autoComplete = document.getElementById('autoCompleteCheck').checked;
  
  if (!taskType) {
    showStatus('Please select a task type', 'warning');
    return;
  }
  
  const btn = document.getElementById('submitJobBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
  
  try {
    // Submit job
    const response = await fetch('/api/jobs/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskType, executor })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showStatus(`Job ${data.jobId} submitted! NID: ${data.receipt.nid.substring(0, 20)}...`, 'success');
      
      // Auto-complete if enabled
      if (autoComplete) {
        setTimeout(async () => {
          await completeJob(data.jobId, taskType, data.jobData.estimatedDuration, executor);
          loadJobs();
        }, 3000);
      }
      
      setTimeout(loadJobs, 1000);
    } else {
      showStatus('Failed to submit job: ' + data.error, 'danger');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-rocket me-2"></i>Submit Job';
  }
}

async function completeJob(jobId, taskType, estimatedDuration, executor) {
  try {
    const response = await fetch('/api/jobs/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, taskType, estimatedDuration, executor })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showStatus(`Job ${jobId} completed! Duration: ${data.completionData.duration}s`, 'success');
    }
  } catch (error) {
    console.error('Error completing job:', error);
  }
}

async function loadJobs() {
  try {
    const response = await fetch('/api/jobs/list');
    const data = await response.json();
    
    const container = document.getElementById('jobsList');
    
    if (!data.jobs || data.jobs.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-4">No jobs yet. Submit a job to get started!</p>';
      return;
    }
    
    container.innerHTML = data.jobs.map(job => renderJobCard(job)).join('');
    
    // Attach event listeners
    document.querySelectorAll('.view-timeline-btn').forEach(btn => {
      btn.addEventListener('click', () => viewTimeline(btn.dataset.jobId));
    });
  } catch (error) {
    console.error('Error loading jobs:', error);
    
    // Demo mode - show mock data
    const container = document.getElementById('jobsList');
    container.innerHTML = `
      <div class="alert alert-warning mb-3">
        <i class="fas fa-info-circle me-2"></i>
        <strong>Demo Mode:</strong> Showing sample data. Deploy to Vercel to submit real GPU jobs on blockchain.
      </div>
    ` + [
      {
        jobId: 'job_demo_001',
        taskType: 'stable-diffusion',
        executor: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
        events: [
          {
            eventType: 'JobSubmitted',
            occurredAt: new Date(Date.now() - 300000).toISOString(),
            nid: 'bafkreiexample1234567890abcdefghijklmnop',
            metadata: { taskType: 'stable-diffusion', gpuType: 'NVIDIA A100 80GB' }
          },
          {
            eventType: 'JobCompleted',
            occurredAt: new Date(Date.now() - 255000).toISOString(),
            nid: 'bafkreiexample0987654321zyxwvutsrqponmlkji',
            metadata: { duration: 45.2, gpuUtilization: '92%' }
          }
        ]
      },
      {
        jobId: 'job_demo_002',
        taskType: 'llm-inference',
        executor: '0x51130dB91B91377A24d6Ebeb2a5fC02748b53ce1',
        events: [
          {
            eventType: 'JobSubmitted',
            occurredAt: new Date(Date.now() - 120000).toISOString(),
            nid: 'bafkreidemo2submitted123456789012345678901234',
            metadata: { taskType: 'llm-inference', gpuType: 'NVIDIA H100 SXM' }
          }
        ]
      }
    ].map(job => renderJobCard(job)).join('');
    
    // Attach event listeners
    document.querySelectorAll('.view-timeline-btn').forEach(btn => {
      btn.addEventListener('click', () => viewTimeline(btn.dataset.jobId));
    });
  }
}

function renderJobCard(job) {
  const status = job.events.some(e => e.eventType === 'JobCompleted') ? 'completed' : 'running';
  const task = TASK_TYPES.find(t => t.id === job.taskType) || TASK_TYPES[0];
  const submittedEvent = job.events.find(e => e.eventType === 'JobSubmitted');
  const completedEvent = job.events.find(e => e.eventType === 'JobCompleted');
  
  return `
    <div class="job-card card ${status} mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 class="mb-1">
              <i class="fas ${task.icon} me-2"></i>${task.name}
            </h6>
            <small class="text-muted mono">${job.jobId}</small>
          </div>
          <span class="badge ${status === 'completed' ? 'bg-success' : 'bg-warning'}">
            ${status === 'completed' ? '✓ Completed' : '⏳ Running'}
          </span>
        </div>
        
        <div class="small text-muted mb-2">
          <div>Executor: <span class="mono">${job.executor.substring(0, 20)}...</span></div>
          ${completedEvent ? `<div>Duration: ${completedEvent.metadata.duration}s | GPU: ${completedEvent.metadata.gpuUtilization}</div>` : ''}
        </div>
        
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-dark view-timeline-btn" data-job-id="${job.jobId}">
            <i class="fas fa-stream me-1"></i> View Timeline
          </button>
          <a href="https://verify.numbersprotocol.io/asset-profile/${submittedEvent.nid}" 
             target="_blank" class="btn btn-sm btn-outline-primary">
            <i class="fas fa-external-link-alt me-1"></i> Verify
          </a>
        </div>
      </div>
    </div>
  `;
}

async function viewTimeline(jobId) {
  try {
    const response = await fetch(`/api/jobs/timeline/${jobId}`);
    const data = await response.json();
    
    if (!data.success) {
      alert('Failed to load timeline');
      return;
    }
    
    const task = TASK_TYPES.find(t => t.id === data.summary.taskType) || TASK_TYPES[0];
    
    const modal = `
      <div class="card mt-3">
        <div class="card-body">
          <h5 class="mb-3">
            <i class="fas ${task.icon} me-2"></i>Job Timeline
          </h5>
          
          <div class="blockchain-proof mb-3">
            <div class="mono small">
              <strong>Job ID:</strong> ${jobId}<br>
              <strong>Status:</strong> <span class="badge ${data.summary.status === 'completed' ? 'bg-success' : 'bg-warning'}">${data.summary.status}</span><br>
              <strong>Events:</strong> ${data.timeline.length}
            </div>
          </div>
          
          <div class="timeline">
            ${data.timeline.map(event => renderTimelineEvent(event)).join('')}
          </div>
          
          <button class="btn btn-sm btn-outline-secondary mt-3" onclick="document.getElementById('timelineContainer').innerHTML = ''">
            <i class="fas fa-times me-1"></i> Close
          </button>
        </div>
      </div>
    `;
    
    document.getElementById('timelineContainer').innerHTML = modal;
  } catch (error) {
    console.error('Error viewing timeline:', error);
  }
}

function renderTimelineEvent(event) {
  const eventClass = event.eventType === 'JobSubmitted' ? 'submitted' : 'completed';
  const metadata = event.metadata;
  
  let artifactSection = '';
  
  // Add C2PA artifact section for JobCompleted events
  if (event.eventType === 'JobCompleted' && metadata.c2paArtifact && metadata.artifact?.c2paSigned) {
    artifactSection = `
      <div class="c2pa-artifact mt-3 p-3 bg-light rounded">
        <h6 class="mb-2">🛡️ C2PA-Signed JSON Artifact</h6>
        <div class="small mb-2">
          <div><strong>Type:</strong> ${metadata.artifact.type || 'json'}</div>
          <div><strong>Size:</strong> ${formatFileSize(metadata.artifact.size || metadata.c2paArtifact.size)}</div>
          <div><strong>C2PA Signed:</strong> ✅ Yes</div>
          <div><strong>Manifest:</strong> ✅ Embedded</div>
        </div>
        
        <div class="btn-group-sm">
          <button onclick="downloadC2PAArtifact('${metadata.jobId}')" class="btn btn-primary btn-sm">
            📥 Download JSON with Proof
          </button>
          <button onclick="verifyC2PAArtifact('${metadata.jobId}')" class="btn btn-outline-secondary btn-sm">
            ✅ Verify C2PA Signature
          </button>
        </div>
        
        <details class="mt-2">
          <summary class="small">📋 Result Preview</summary>
          <pre class="small mt-1 p-2 bg-white border rounded">${getArtifactPreview(metadata.c2paArtifact.content)}</pre>
        </details>
      </div>
    `;
  }
  
  return `
    <div class="timeline-event ${eventClass}">
      <div class="d-flex justify-content-between mb-2">
        <strong>${event.eventType}</strong>
        <small class="text-muted">${new Date(event.occurredAt).toLocaleString()}</small>
      </div>
      
      <div class="blockchain-proof">
        <div class="mono small mb-2">
          <strong>NID:</strong> ${event.nid}<br>
          <strong>Proof Hash:</strong> ${event.txHash}
        </div>
        
        <div class="small">
          ${Object.entries(metadata).map(([key, value]) => {
            if (typeof value === 'object' && key !== 'c2paArtifact') return '';
            if (key === 'c2paArtifact') return '';
            return `<div><strong>${key}:</strong> ${value}</div>`;
          }).join('')}
        </div>
        
        <a href="${event.explorerUrl}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">
          <i class="fas fa-search me-1"></i> Verify on Blockchain
        </a>
      </div>
      
      ${artifactSection}
    </div>
  `;
}

function getArtifactPreview(artifactContent) {
  try {
    const artifact = JSON.parse(artifactContent);
    const preview = {
      jobId: artifact.jobId,
      taskType: artifact.taskType,
      executedAt: artifact.executedAt,
      result: artifact.result,
      execution: artifact.execution,
      c2pa: {
        version: artifact.c2pa?.version,
        signed: !!artifact.c2pa?.signature
      }
    };
    return JSON.stringify(preview, null, 2);
  } catch (error) {
    return 'Preview unavailable';
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function downloadC2PAArtifact(jobId) {
  try {
    const response = await fetch(`/api/artifacts/download/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jobId}_result_c2pa.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showStatus('✅ C2PA artifact downloaded successfully!', 'success');
  } catch (error) {
    console.error('Error downloading artifact:', error);
    showStatus(`❌ Failed to download artifact: ${error.message}`, 'danger');
  }
}

async function verifyC2PAArtifact(jobId) {
  try {
    // First download the artifact content
    const response = await fetch(`/api/artifacts/download/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const artifactContent = await response.text();
    
    // Then verify the C2PA signature
    const verifyResponse = await fetch('/api/artifacts/verify-c2pa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ artifactContent })
    });
    
    const verificationResult = await verifyResponse.json();
    
    if (verificationResult.valid) {
      showC2PAVerificationModal(verificationResult.manifest);
    } else {
      showStatus(`❌ C2PA verification failed: ${verificationResult.error}`, 'danger');
    }
  } catch (error) {
    console.error('Error verifying C2PA artifact:', error);
    showStatus(`❌ Failed to verify artifact: ${error.message}`, 'danger');
  }
}

function showC2PAVerificationModal(manifest) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.setAttribute('tabindex', '-1');
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">✅ C2PA Verification Result</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="verification-success">
            <div class="alert alert-success">
              <h6>✓ Signature Valid</h6>
              <h6>✓ Not Tampered</h6>
            </div>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Job ID:</strong> ${manifest.jobId}</p>
                <p><strong>GPU:</strong> ${manifest.gpuType || 'N/A'}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Blockchain NID:</strong> <code class="small">${manifest.blockchainNid || 'N/A'}</code></p>
                <p><strong>Signed At:</strong> ${new Date(manifest.signedAt).toLocaleString()}</p>
              </div>
            </div>
            ${manifest.explorerUrl ? `
              <div class="text-center mt-3">
                <a href="${manifest.explorerUrl}" target="_blank" class="btn btn-outline-primary">
                  🔍 View on Numbers Explorer
                </a>
              </div>
            ` : ''}
          </div>
          <div class="verification-note mt-3">
            <div class="alert alert-info">
              <small>This JSON artifact is authentic and provably generated by ProofsyGPU.</small>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Initialize Bootstrap modal
  const bootstrapModal = new bootstrap.Modal(modal);
  bootstrapModal.show();
  
  // Remove modal from DOM when hidden
  modal.addEventListener('hidden.bs.modal', () => {
    document.body.removeChild(modal);
  });
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('submitStatus');
  statusDiv.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  setTimeout(() => {
    statusDiv.innerHTML = '';
  }, 5000);
}
