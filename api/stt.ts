import { getProviderApiKeys } from './_keyResolver';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Read raw audio chunks from request body
    const chunks: Buffer[] = [];
    if (req.body && Buffer.isBuffer(req.body)) {
      chunks.push(req.body);
    } else if (req.body && typeof req.body === 'string') {
      chunks.push(Buffer.from(req.body, 'base64'));
    } else {
      await new Promise<void>((resolve, reject) => {
        req.on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', () => resolve());
        req.on('error', (err: any) => reject(err));
      });
    }

    const audioBuffer = Buffer.concat(chunks);
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data received in request' });
    }

    // 2. Resolve active Groq API keys in priority order
    const groqKeys = await getProviderApiKeys('GROQ_API_KEY');
    if (!groqKeys || groqKeys.length === 0) {
      return res.status(500).json({ error: 'No active GROQ_API_KEY available' });
    }

    const contentType = req.headers['content-type'] || 'audio/wav';
    let fileExt = 'wav';
    if (contentType.includes('webm')) fileExt = 'webm';
    else if (contentType.includes('ogg')) fileExt = 'ogg';
    else if (contentType.includes('mp4') || contentType.includes('m4a')) fileExt = 'm4a';
    else if (contentType.includes('mp3') || contentType.includes('mpeg')) fileExt = 'mp3';

    let lastError: any = null;

    // 3. Try Groq keys in priority order
    for (const keyEntry of groqKeys) {
      try {
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: contentType });
        formData.append('file', audioBlob, `recording.${fileExt}`);
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'de');
        formData.append('response_format', 'verbose_json');
        formData.append(
          'prompt',
          "This is a language learner's German speech practice attempt. It may contain grammar errors, wrong word order, incorrect case usage, or mispronunciations. Transcribe exactly what is said, including any mistakes — do not correct, normalize, or autocorrect the German toward what a fluent speaker would have said."
        );

        const sttRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keyEntry.key}`,
          },
          body: formData,
        });

        if (!sttRes.ok) {
          const errText = await sttRes.text();
          throw new Error(`Groq Whisper HTTP ${sttRes.status}: ${errText}`);
        }

        const data: any = await sttRes.json();
        const transcript = (data.text || '').trim();

        let confidence: 'high' | 'medium' | 'low' = 'high';
        if (Array.isArray(data.segments) && data.segments.length > 0) {
          const avgLogprob =
            data.segments.reduce((acc: number, s: any) => acc + (typeof s.avg_logprob === 'number' ? s.avg_logprob : 0), 0) /
            data.segments.length;
          if (avgLogprob < -0.85) {
            confidence = 'low';
          } else if (avgLogprob < -0.5) {
            confidence = 'medium';
          } else {
            confidence = 'high';
          }
        }

        return res.status(200).json({
          transcript,
          confidence,
          key_id: keyEntry.id,
          key_priority: keyEntry.priority,
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`[API /api/stt] Groq Key #${keyEntry.priority} failed:`, err?.message || err);
      }
    }

    return res.status(502).json({
      error: `All active Groq keys failed for STT: ${lastError?.message || 'Unknown error'}`,
    });
  } catch (err: any) {
    console.error('[API /api/stt] Unexpected error:', err);
    return res.status(500).json({ error: err?.message || 'Internal STT server error' });
  }
}
