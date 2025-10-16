// List all GPU jobs

import { getAllJobs } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const jobs = await getAllJobs();

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({ 
      error: 'Failed to list jobs', 
      details: error.message 
    });
  }
}
