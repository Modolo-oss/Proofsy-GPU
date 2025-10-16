// Verify C2PA signature of JSON artifact

import { verifyC2PASignature } from '../../lib/c2pa-signer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { artifactContent } = req.body;

    if (!artifactContent) {
      return res.status(400).json({ error: 'Artifact content is required' });
    }

    // Parse the artifact JSON
    let signedArtifact;
    try {
      signedArtifact = typeof artifactContent === 'string' 
        ? JSON.parse(artifactContent) 
        : artifactContent;
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Invalid JSON artifact',
        details: parseError.message 
      });
    }

    // Verify C2PA signature
    const verificationResult = verifyC2PASignature(signedArtifact);

    if (verificationResult.valid) {
      res.status(200).json({
        success: true,
        valid: true,
        tampered: false,
        manifest: verificationResult.manifest,
        message: 'C2PA signature verification successful'
      });
    } else {
      res.status(400).json({
        success: false,
        valid: false,
        error: verificationResult.error,
        message: 'C2PA signature verification failed'
      });
    }

  } catch (error) {
    console.error('Error verifying C2PA signature:', error);
    res.status(500).json({ 
      error: 'Failed to verify C2PA signature',
      details: error.message 
    });
  }
}
