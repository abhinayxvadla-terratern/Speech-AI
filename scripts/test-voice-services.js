#!/usr/bin/env node

/**
 * Standalone Test Script for Voice Services
 * 
 * Verifies two services in isolation without UI or VoiceAdapter dependencies:
 *   TEST 1 — Groq Whisper STT (whisper-large-v3, language: de)
 *   TEST 2 — Microsoft Edge TTS (German neural voice)
 * 
 * Usage:
 *   node scripts/test-voice-services.js [optional_path_to_german_audio_file]
 *   npm run test:voice
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Helper to resolve MIME type for audio files
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.m4a': return 'audio/m4a';
    case '.ogg': return 'audio/ogg';
    case '.webm': return 'audio/webm';
    case '.flac': return 'audio/flac';
    default: return 'application/octet-stream';
  }
}

/**
 * TEST 2 — Edge TTS
 * Synthesizes a German test string and saves it to a local mp3 file.
 */
async function testEdgeTTS(options = {}) {
  const text = options.text || 'Ich möchte bitte zahlen';
  const voice = options.voice || 'de-DE-KatjaNeural';
  const outputPath = options.outputPath || path.resolve(PROJECT_ROOT, 'test_output.mp3');

  console.log('\n======================================================');
  console.log('TEST 2 — Edge TTS (Text-to-Speech)');
  console.log('======================================================');
  console.log(`[Edge TTS] Test Phrase : "${text}"`);
  console.log(`[Edge TTS] Voice       : ${voice}`);
  console.log(`[Edge TTS] Output File : ${outputPath}`);

  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    const outStream = fs.createWriteStream(outputPath);

    await new Promise((resolve, reject) => {
      audioStream.pipe(outStream);
      outStream.on('finish', resolve);
      audioStream.on('error', reject);
      outStream.on('error', reject);
    });

    // Verify file existence and non-zero size
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file was not created: ${outputPath}`);
    }

    const stat = fs.statSync(outputPath);
    if (stat.size === 0) {
      throw new Error(`Generated audio file is empty (0 bytes): ${outputPath}`);
    }

    console.log(`[Edge TTS] File Size   : ${(stat.size / 1024).toFixed(2)} KB (${stat.size} bytes)`);
    console.log('[SUCCESS] TEST 2 — Edge TTS generated audio file successfully.');
    return { success: true, filePath: outputPath, fileSize: stat.size };
  } catch (err) {
    console.error(`[FAILURE] TEST 2 — Edge TTS error: ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    try {
      tts.close();
    } catch {
      // ignore socket closing issues on finish
    }
  }
}

/**
 * TEST 1 — Groq Whisper STT
 * Transcribes a local German audio file using Groq's whisper-large-v3 model.
 */
async function testGroqWhisper(audioFilePath) {
  console.log('\n======================================================');
  console.log('TEST 1 — Groq Whisper STT (Speech-to-Text)');
  console.log('======================================================');

  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    console.error('[FAILURE] TEST 1 — GROQ_API_KEY is not set in environment or .env file.');
    return { success: false, error: 'GROQ_API_KEY missing' };
  }

  const maskedKey = apiKey.slice(0, 6) + '...' + apiKey.slice(-4);
  console.log(`[Groq STT] API Key     : ${maskedKey}`);
  console.log(`[Groq STT] Audio File  : ${audioFilePath}`);
  console.log(`[Groq STT] Model       : whisper-large-v3`);
  console.log(`[Groq STT] Language    : de`);

  if (!fs.existsSync(audioFilePath)) {
    console.error(`[FAILURE] TEST 1 — Target audio file does not exist: ${audioFilePath}`);
    return { success: false, error: `File not found: ${audioFilePath}` };
  }

  const stat = fs.statSync(audioFilePath);
  if (stat.size === 0) {
    console.error(`[FAILURE] TEST 1 — Target audio file is empty (0 bytes).`);
    return { success: false, error: 'Empty audio file' };
  }

  console.log(`[Groq STT] File Size   : ${(stat.size / 1024).toFixed(2)} KB (${stat.size} bytes)`);

  try {
    const audioBuffer = fs.readFileSync(audioFilePath);
    const fileName = path.basename(audioFilePath);
    const mimeType = getMimeType(audioFilePath);

    const file = new File([audioBuffer], fileName, { type: mimeType });

    const form = new FormData();
    form.append('file', file);
    form.append('model', 'whisper-large-v3');
    form.append('language', 'de');
    form.append('response_format', 'json');

    console.log('[Groq STT] Sending transcription request to Groq API...');
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    const transcript = (data.text || '').trim();

    console.log(`[Groq STT] Transcript  : "${transcript}"`);
    console.log('[SUCCESS] TEST 1 — Groq Whisper STT transcribed audio successfully.');

    return {
      success: true,
      transcript,
      raw: data,
    };
  } catch (err) {
    console.error(`[FAILURE] TEST 1 — Groq Whisper STT error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Main Runner
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Voice Services Standalone Verification Suite     ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const customAudioArg = process.argv[2];
  let audioForSTT = null;

  if (customAudioArg) {
    audioForSTT = path.resolve(process.cwd(), customAudioArg);
    console.log(`[Config] User provided custom audio file for STT: ${audioForSTT}`);
  }

  // TEST 2: Run Edge TTS first to generate test_output.mp3 (also provides fallback audio for STT)
  const defaultOutputPath = path.resolve(PROJECT_ROOT, 'test_output.mp3');
  const ttsResult = await testEdgeTTS({
    text: 'Ich möchte bitte zahlen',
    voice: 'de-DE-KatjaNeural',
    outputPath: defaultOutputPath,
  });

  // Determine which audio file to feed to Groq Whisper STT
  if (!audioForSTT) {
    if (ttsResult.success) {
      audioForSTT = defaultOutputPath;
      console.log(`[Config] Using freshly synthesized Edge TTS audio for Groq STT verification: ${audioForSTT}`);
    } else {
      // Fallback check if test_audio_german exists
      const candidates = [
        path.resolve(PROJECT_ROOT, 'test_audio_german.mp3'),
        path.resolve(PROJECT_ROOT, 'test_audio_german.m4a'),
        path.resolve(PROJECT_ROOT, 'test_audio_german.wav'),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          audioForSTT = cand;
          break;
        }
      }
    }
  }

  // TEST 1: Run Groq Whisper STT
  const sttResult = await testGroqWhisper(audioForSTT || defaultOutputPath);

  // Summary
  console.log('\n======================================================');
  console.log('FINAL TEST SUMMARY');
  console.log('======================================================');
  console.log(`TEST 1 — Groq Whisper STT : ${sttResult.success ? 'PASSED [OK]' : 'FAILED [ERR]'}`);
  if (sttResult.success) {
    console.log(`  -> Transcript: "${sttResult.transcript}"`);
  } else {
    console.log(`  -> Reason: ${sttResult.error}`);
  }

  console.log(`TEST 2 — Edge TTS         : ${ttsResult.success ? 'PASSED [OK]' : 'FAILED [ERR]'}`);
  if (ttsResult.success) {
    console.log(`  -> Generated File: ${path.relative(PROJECT_ROOT, ttsResult.filePath)} (${(ttsResult.fileSize / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  -> Reason: ${ttsResult.error}`);
  }
  console.log('======================================================\n');

  if (sttResult.success && ttsResult.success) {
    console.log('All voice service tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error('One or more voice service tests failed.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error during test execution:', err);
  process.exit(1);
});
