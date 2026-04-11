/**
 * TTS Event Queue System
 *
 * Processes text-to-speech announcements one at a time using Web Speech API.
 * Reads voice/rate/volume settings from useSettingsStore.
 * Respects mute state (voiceEnabled).
 *
 * v2 fixes (v2.12.2):
 * - Fixed Chrome cancel()→speak() race condition: added 50ms delay after cancel()
 * - Fixed isProcessing permanently stuck: added 30s watchdog timeout per utterance
 * - Fixed onvoiceschanged handler being overwritten by SettingsPanel: uses addEventListener
 * - Fixed keepAlive interval leak on external cancel(): cleanup in stopCurrent()
 */

export interface TTSOptions {
  voice?: string;
  rate?: number;
  volume?: number;
  lang?: string;
}

interface TTSEntry {
  id: string;
  text: string;
  options: TTSOptions;
}

let entryIdCounter = 0;
function nextEntryId(): string {
  return `tts-${++entryIdCounter}-${Date.now().toString(36)}`;
}

/** Delay helper for Chrome cancel/speak race condition */
function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

class TTSQueue {
  private queue: TTSEntry[] = [];
  private isProcessing = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private processingDelay = 300; // ms between messages
  private _ttsEnabled = true;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private static readonly WATCHDOG_MS = 30000; // 30s timeout for stuck utterances

  constructor() {
    // Ensure SpeechSynthesis is available — use addEventListener so other
    // components (SettingsPanel) can't accidentally overwrite our handler.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener?.('voiceschanged', () => {
        // voices are now available — no-op, but keeps the synth warm
      });
    }
  }

  /**
   * Enable or disable TTS output. When disabled, enqueued messages are silently discarded.
   */
  setTTSEnabled(enabled: boolean): void {
    this._ttsEnabled = enabled;
    if (!enabled && this.isProcessing) {
      this.skip();
    }
  }

  /**
   * Check if TTS is enabled
   */
  isTTSEnabled(): boolean {
    return this._ttsEnabled;
  }

  /**
   * Enqueue a text message for TTS output.
   * The caller should pass voice/rate/volume from settings store.
   * If voiceEnabled is false, the caller should not call enqueue.
   * Respects the internal ttsEnabled flag.
   */
  enqueue(text: string, options?: TTSOptions): string {
    const id = nextEntryId();

    // Respect our own ttsEnabled flag
    if (!this._ttsEnabled) {
      return id;
    }

    const entry: TTSEntry = { id, text, options: options || {} };
    this.queue.push(entry);
    this.processQueue();
    return id;
  }

  /**
   * Clear all pending TTS messages and stop current speech.
   */
  clear(): void {
    this.queue = [];
    this.stopCurrent();
    this.isProcessing = false;
  }

  /**
   * Skip the current TTS message and move to the next one.
   */
  skip(): void {
    this.stopCurrent();
    this.isProcessing = false;
    this.processQueue();
  }

  /**
   * Get the number of pending messages in the queue (including currently playing).
   */
  get pendingCount(): number {
    return this.queue.length + (this.isProcessing ? 1 : 0);
  }

  /**
   * Check if currently processing/speaking.
   */
  get isSpeaking(): boolean {
    return this.isProcessing;
  }

  private stopCurrent(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.clearWatchdog();
    this.clearKeepAlive();
  }

  private startWatchdog(): void {
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      console.warn('[TTSQueue] Watchdog: utterance stuck for 30s, force-skipping');
      this.currentUtterance = null;
      this.isProcessing = false;
      this.clearKeepAlive();
      this.processQueue();
    }, TTSQueue.WATCHDOG_MS);
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer !== null) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private startKeepAlive(synth: SpeechSynthesis): void {
    this.clearKeepAlive();
    // Chrome bug workaround: pause/resume every 10s to keep synth alive on long utterances
    this.keepAliveTimer = setInterval(() => {
      if (synth.speaking) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
  }

  private clearKeepAlive(): void {
    if (this.keepAliveTimer !== null) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    if (!this._ttsEnabled) {
      this.queue = [];
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    this.isProcessing = true;
    const entry = this.queue.shift()!;

    try {
      await this.speak(entry);
    } catch (err) {
      console.warn('[TTSQueue] Speech error:', err);
    }

    this.isProcessing = false;

    // Delay before next message
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.processingDelay);
    }
  }

  private async speak(entry: TTSEntry): Promise<void> {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Chrome workaround: synth may get paused after ~15s of inactivity.
    // IMPORTANT: Must call cancel() first, then wait 50ms before speak().
    // Without the delay, Chrome silently drops the utterance (no audio, no error).
    synth.cancel();
    await delay(50);

    const utterance = new SpeechSynthesisUtterance(entry.text);
    this.currentUtterance = utterance;

    // Set voice
    const voices = synth.getVoices();
    if (entry.options.voice) {
      const matchedVoice = voices.find(v => v.name === entry.options.voice);
      if (matchedVoice) utterance.voice = matchedVoice;
    }

    // Set rate (clamp between 0.1 and 10)
    if (entry.options.rate !== undefined) {
      utterance.rate = Math.max(0.1, Math.min(10, entry.options.rate));
    }

    // Set volume (0-100 -> 0-1)
    if (entry.options.volume !== undefined) {
      utterance.volume = Math.max(0, Math.min(1, entry.options.volume / 100));
    }

    // Set language
    if (entry.options.lang) {
      utterance.lang = entry.options.lang;
    }

    // Start watchdog — if Chrome never fires onend/onerror, we recover after 30s
    this.startWatchdog();

    // Start keepAlive — prevents Chrome from pausing long utterances
    this.startKeepAlive(synth);

    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => {
        this.currentUtterance = null;
        this.clearWatchdog();
        this.clearKeepAlive();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        this.clearWatchdog();
        this.clearKeepAlive();
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve();
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      synth.speak(utterance);
    });
  }
}

// Singleton instance
export const ttsQueue = new TTSQueue();

/**
 * Convenience function to enqueue a TTS alert message.
 * Used by the alert system to speak when an alert triggers.
 */
export function enqueueTTSAlert(
  text: string,
  options?: TTSOptions
): string {
  return ttsQueue.enqueue(text, options);
}

/**
 * Check if TTS is available in this browser environment.
 */
export function isTTSAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.speechSynthesis;
}
