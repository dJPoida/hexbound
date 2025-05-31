import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'POST') {
    const { counter } = request.body;
    console.log('Received counter value:', counter);

    // TODO: Update counter in Redis
    // TODO: Send web push notification

    response.status(200).json({ message: 'Turn ended successfully', newCounterValue: counter });
  } else {
    response.setHeader('Allow', ['POST']);
    response.status(405).end(`Method ${request.method} Not Allowed`);
  }
} 