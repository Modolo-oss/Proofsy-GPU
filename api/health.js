// Health check endpoint

export default async function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    service: 'ProofsyGPU',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    blockchain: 'Numbers Mainnet',
    standard: 'ERC-7053'
  });
}
