// Vercel Serverless Function: Edge TTS Endpoint
// Provides Edge TTS synthesis in serverless environments

export default async function handler(req: any, res: any) {
  try {
    const text = req.query?.text || req.body?.text;
    const voice = req.query?.voice || req.body?.voice || 'de-DE-KatjaNeural';

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" parameter' });
    }

    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    const chunks: any[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      audioStream.on('end', () => {
        try { tts.close(); } catch {}
        resolve();
      });
      audioStream.on('error', (err: any) => {
        try { tts.close(); } catch {}
        reject(err);
      });
    });

    const fullBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', fullBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(fullBuffer);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'TTS Error' });
    }
  }
}
