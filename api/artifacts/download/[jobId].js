// Download C2PA-signed JSON artifact

import { getJobTimeline } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    // Get job timeline to find completed event with C2PA artifact
    const timeline = await getJobTimeline(jobId);
    const completedEvent = timeline.find(event => event.eventType === 'JobCompleted');
    
    if (!completedEvent) {
      return res.status(404).json({ error: 'Job completion not found' });
    }

    const metadata = completedEvent.metadata;
    const c2paArtifact = metadata?.c2paArtifact;

    if (!c2paArtifact || !c2paArtifact.content) {
      return res.status(404).json({ error: 'C2PA artifact not found' });
    }

    // Set appropriate headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${jobId}_result_c2pa.json"`);
    res.setHeader('Content-Length', c2paArtifact.size);
    
    // Send the C2PA-signed artifact
    res.status(200).send(c2paArtifact.content);

  } catch (error) {
    console.error('Error downloading artifact:', error);
    res.status(500).json({ 
      error: 'Failed to download artifact',
      details: error.message 
    });
  }
}
