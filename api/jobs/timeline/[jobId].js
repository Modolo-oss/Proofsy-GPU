// Get job timeline (all receipts for a specific job) - Path Parameter Version

import { getJobTimeline } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId path parameter is required' });
    }

    const timeline = await getJobTimeline(jobId);

    if (timeline.length === 0) {
      return res.status(404).json({ 
        error: 'Job not found',
        jobId 
      });
    }

    // Calculate job summary
    const submittedEvent = timeline.find(e => e.eventType === 'JobSubmitted');
    const completedEvent = timeline.find(e => e.eventType === 'JobCompleted');

    const summary = {
      jobId,
      status: completedEvent ? 'completed' : 'running',
      taskType: submittedEvent?.taskType,
      submittedAt: submittedEvent?.occurredAt,
      completedAt: completedEvent?.occurredAt,
      duration: completedEvent?.duration,
      eventsCount: timeline.length
    };

    res.status(200).json({
      success: true,
      jobId,
      summary,
      timeline
    });
  } catch (error) {
    console.error('Error fetching job timeline:', error);
    res.status(500).json({ 
      error: 'Failed to fetch job timeline', 
      details: error.message 
    });
  }
}
