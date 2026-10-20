// Real-time audio engine and procedural music synthesizer for Keyboard Rhythm Game
import { RhythmNote, KeyboardSong } from '../types';

export class RhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPlaying: boolean = false;
  private scheduledTimer: any = null;
  private currentSong: KeyboardSong | null = null;

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  // Play a custom audio buffer (e.g. from uploaded file)
  public playBuffer(buffer: AudioBuffer, onEnded?: () => void) {
    this.init();
    if (!this.ctx) return;
    this.stop();

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    
    source.onended = () => {
      this.isPlaying = false;
      if (onEnded) onEnded();
    };

    const now = this.ctx.currentTime;
    source.start(now);
    this.currentSource = source;
    this.currentBuffer = buffer;
    this.startTime = now;
    this.isPlaying = true;
  }

  // Synthesize and play built-in royalty-free procedural song tracks
  public playProceduralTrack(song: KeyboardSong, onEnded?: () => void) {
    this.init();
    if (!this.ctx) return;
    this.stop();

    this.currentSong = song;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.startTime = now;
    this.isPlaying = true;

    const bpm = song.bpm || 120;
    const beatInterval = 60 / bpm;
    const totalDuration = song.duration || 60;
    const totalBeats = Math.floor(totalDuration / beatInterval);

    // Schedule drum & bass patterns across duration
    const bassFrequencies = song.genre === 'synthwave'
      ? [110, 110, 130.81, 146.83, 98, 98, 123.47, 110] // A2, C3, D3, G2
      : song.genre === 'chiptune'
      ? [130.81, 164.81, 196.00, 261.63] // C3, E3, G3, C4
      : song.genre === 'techno'
      ? [82.41, 82.41, 87.31, 82.41] // E2 driving
      : [130.81, 146.83, 164.81, 174.61]; // Lofi warm

    const melodyNotes = song.genre === 'synthwave'
      ? [440, 523.25, 659.25, 783.99, 880, 659.25]
      : song.genre === 'chiptune'
      ? [523.25, 587.33, 659.25, 783.99, 1046.5]
      : [329.63, 392.00, 440.00, 523.25];

    // Master bus
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(ctx.destination);

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = now + beat * beatInterval;

      // 1. Kick on beat 0, 2 (or 4 on the floor for techno)
      if (song.genre === 'techno' || beat % 2 === 0) {
        this.synthKick(ctx, masterGain, beatTime);
      }

      // 2. Snare / Clap on beat 1, 3
      if (beat % 2 === 1) {
        this.synthSnare(ctx, masterGain, beatTime);
      }

      // 3. Hi-hat every eighth note
      this.synthHiHat(ctx, masterGain, beatTime);
      this.synthHiHat(ctx, masterGain, beatTime + beatInterval * 0.5, true);

      // 4. Bass note
      const bassNote = bassFrequencies[beat % bassFrequencies.length];
      this.synthBass(ctx, masterGain, beatTime, bassNote, beatInterval * 0.8, song.genre);

      // 5. Melodic accent
      if (beat % 2 === 0) {
        const melNote = melodyNotes[(Math.floor(beat / 2)) % melodyNotes.length];
        this.synthMelody(ctx, masterGain, beatTime, melNote, beatInterval * 0.4, song.genre);
      }
    }

    // Schedule track end callback
    this.scheduledTimer = setTimeout(() => {
      this.isPlaying = false;
      if (onEnded) onEnded();
    }, totalDuration * 1000);
  }

  private synthKick(ctx: AudioContext, dest: AudioNode, time: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + 0.16);
    } catch {}
  }

  private synthSnare(ctx: AudioContext, dest: AudioNode, time: number) {
    try {
      // Noise component
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);

      noise.start(time);
      noise.stop(time + 0.13);

      // Tonal punch
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

      oscGain.gain.setValueAtTime(0.35, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);

      osc.connect(oscGain);
      oscGain.connect(dest);

      osc.start(time);
      osc.stop(time + 0.1);
    } catch {}
  }

  private synthHiHat(ctx: AudioContext, dest: AudioNode, time: number, offbeat = false) {
    try {
      const bufferSize = ctx.sampleRate * (offbeat ? 0.04 : 0.02);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(offbeat ? 0.15 : 0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + (offbeat ? 0.04 : 0.025));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start(time);
      noise.stop(time + 0.05);
    } catch {}
  }

  private synthBass(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number, genre: string) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = genre === 'chiptune' ? 'square' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(genre === 'techno' ? 700 : 450, time);
      filter.frequency.exponentialRampToValueAtTime(120, time + dur);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + dur + 0.02);
    } catch {}
  }

  private synthMelody(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number, genre: string) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = genre === 'chiptune' ? 'square' : genre === 'synthwave' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + dur + 0.02);
    } catch {}
  }

  // Get current elapsed playback time in seconds
  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    return Math.max(0, this.ctx.currentTime - this.startTime);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
    }
    this.isPlaying = false;
  }

  // Decode uploaded audio file and detect rhythmic onsets for notes
  public async decodeAndAnalyzeUploadedAudio(
    file: File,
    laneKeys: string[] = ['D', 'F', 'J', 'K']
  ): Promise<{
    buffer: AudioBuffer;
    notes: RhythmNote[];
    duration: number;
    estimatedBpm: number;
  }> {
    this.init();
    if (!this.ctx) throw new Error('AudioContext unavailable');

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Window size for energy detection (approx 30ms)
    const windowSize = Math.floor(sampleRate * 0.03);
    const energies: number[] = [];

    for (let i = 0; i < channelData.length; i += windowSize) {
      let sum = 0;
      const limit = Math.min(i + windowSize, channelData.length);
      for (let j = i; j < limit; j++) {
        sum += channelData[j] * channelData[j];
      }
      energies.push(Math.sqrt(sum / (limit - i)));
    }

    // Dynamic threshold peak detection
    const notes: RhythmNote[] = [];
    let avgEnergy = 0;
    for (let e of energies) avgEnergy += e;
    avgEnergy /= energies.length || 1;

    const threshold = avgEnergy * 1.45;
    let lastPeakTime = -1;
    const minNoteSpacing = 0.28; // Minimum seconds between notes in the highway

    for (let i = 2; i < energies.length - 2; i++) {
      const e = energies[i];
      if (
        e > threshold &&
        e > energies[i - 1] &&
        e > energies[i - 2] &&
        e >= energies[i + 1] &&
        e >= energies[i + 2]
      ) {
        const noteTime = (i * windowSize) / sampleRate;
        if (noteTime > 1.2 && noteTime < duration - 1.0) {
          if (noteTime - lastPeakTime >= minNoteSpacing) {
            lastPeakTime = noteTime;
            const lane = notes.length % laneKeys.length;
            notes.push({
              id: `user_note_${notes.length}`,
              time: Number(noteTime.toFixed(2)),
              lane,
              key: laneKeys[lane],
            });
          }
        }
      }
    }

    // Fallback if audio was too quiet: synthesize standard tempo notes
    if (notes.length < 15) {
      const bpm = 120;
      const step = 60 / bpm;
      for (let t = 2.0; t < duration - 1.0; t += step) {
        const lane = Math.floor(Math.random() * laneKeys.length);
        notes.push({
          id: `synth_note_${notes.length}`,
          time: Number(t.toFixed(2)),
          lane,
          key: laneKeys[lane],
        });
      }
    }

    return {
      buffer: audioBuffer,
      notes,
      duration,
      estimatedBpm: Math.round((notes.length / duration) * 60) || 120,
    };
  }

  // Play pleasant mechanical keyboard click or note hit
  public playHitSound(judgement: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS') {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (judgement === 'PERFECT') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      } else if (judgement === 'GREAT') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      } else if (judgement === 'GOOD') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      } else {
        // MISS
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }
}

export const rhythmAudio = new RhythmAudioEngine();
