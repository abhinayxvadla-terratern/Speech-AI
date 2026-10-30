import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

async function synthesize(text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('de-DE-KatjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks = [];
  await new Promise((resolve, reject) => {
    audioStream.on('data', (c) => chunks.push(c));
    audioStream.on('end', () => {
      tts.close();
      resolve();
    });
    audioStream.on('error', reject);
  });
  return Buffer.concat(chunks);
}

async function testVerbose() {
  const buf = await synthesize('Ich möchte bitte zahlen.');
  const file = new File([buf], 'test.mp3', { type: 'audio/mpeg' });
  const form = new FormData();
  form.append('file', file);
  form.append('model', 'whisper-large-v3');
  form.append('language', 'de');
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const data = await res.json();
  console.log('Verbose response keys:', Object.keys(data));
  if (data.segments) {
    console.log('Segment 0 sample:', {
      avg_logprob: data.segments[0]?.avg_logprob,
      no_speech_prob: data.segments[0]?.no_speech_prob,
    });
  }
}

testVerbose().catch(console.error);
