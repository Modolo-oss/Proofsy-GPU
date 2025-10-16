// Verify C2PA signature of JSON artifact

import { verifyC2PASignature } from '../../lib/c2pa-signer.js';

export default async function handler(req, res) {
  console.log('C2PA Verification API called:', {
    method: req.method,
    bodyKeys: Object.keys(req.body || {}),
    bodyType: typeof req.body
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { artifactContent } = req.body;
    
    console.log('Request body analysis:', {
      hasArtifactContent: !!artifactContent,
      artifactContentType: typeof artifactContent,
      artifactContentLength: artifactContent ? artifactContent.length : 0,
      bodyKeys: Object.keys(req.body || {})
    });

    if (!artifactContent) {
      console.error('No artifact content provided');
      return res.status(400).json({ 
        error: 'Artifact content is required',
        receivedKeys: Object.keys(req.body || {})
      });
    }

    // Parse the artifact JSON
    let signedArtifact;
    try {
      signedArtifact = typeof artifactContent === 'string' 
        ? JSON.parse(artifactContent) 
        : artifactContent;
      
      console.log('Parsed artifact structure:', {
        hasJobId: !!signedArtifact.jobId,
        hasC2pa: !!signedArtifact.c2pa,
        hasSignature: !!signedArtifact.c2pa?.signature,
        artifactKeys: Object.keys(signedArtifact)
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(400).json({ 
        error: 'Invalid JSON artifact',
        details: parseError.message,
        contentPreview: artifactContent.substring(0, 200) + '...'
      });
    }

    // Verify C2PA signature
    console.log('Starting C2PA signature verification...');
    const verificationResult = verifyC2PASignature(signedArtifact);
    console.log('Verification result:', verificationResult);

    if (verificationResult.valid) {
      console.log('C2PA verification successful');
      res.status(200).json({
        success: true,
        valid: true,
        tampered: false,
        manifest: verificationResult.manifest,
        message: 'C2PA signature verification successful'
      });
    } else {
      console.log('C2PA verification failed:', verificationResult.error);
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
      details: error.message,
      stack: error.stack
    });
  }
}
