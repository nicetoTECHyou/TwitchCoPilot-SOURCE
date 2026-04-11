/**
 * MqttSync — MQTT-based real-time state sync between devices.
 *
 * Architecture:
 *   🖥️ PC (OBS Overlay) → creates a room → shows a 6-char code
 *   📱 Phone (CoPilot) → joins the room → sends nav/twitch/weather data every second
 *
 * Uses EMQX free public MQTT broker as signaling/data relay.
 * MQTT is loaded LAZILY (dynamic import) so it doesn't affect app startup or bundle size
 * for users who don't use the sync feature.
 */

/* ── Broker config ───────────────────────────────────────── */

const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const TOPIC_PREFIX = 'cargonavi/sync/v2/';

/* ── Shared message protocol ─────────────────────────────────── */

export interface SyncNavData {
  type: 'nav';
  currentSpeed: number;
  currentLat: number | null;
  currentLon: number | null;
  remainingDistance: number;
  eta: string;
  ascent: number;
  descent: number;
  isNavigating: boolean;
  isDemoMode: boolean;
  vehicleName: string;
  vehicleColor: string;
  startName: string;
  finishName: string;
  kmToday: number;
  routeProgress: number;
  routeExists: boolean;
  routeGeometry: [number, number][] | null; // [lon, lat][] — simplified for overlay minimap
  // Route info (from calculated route, always sent when route exists)
  routeDistance: number;     // total route distance in meters
  routeAscent: number;      // total route ascent in meters
  routeDescent: number;     // total route descent in meters
  routeDuration: number;    // total route duration in seconds
}

export interface SyncTwitchData {
  type: 'twitch';
  channel: string;
  connected: boolean;
  messages: Array<{
    id: string;
    username: string;
    displayName: string;
    color: string;
    message: string;
  }>;
  activeVote: {
    id: string;
    question: string;
    options: string[];
    votes: Record<string, number>;
    isActive: boolean;
    winner?: string;
  } | null;
}

export interface SyncWeatherData {
  type: 'weather';
  temperature: number | null;
  windSpeed: number | null;
}

export type SyncMessage = SyncNavData | SyncTwitchData | SyncWeatherData;

type SyncEvent = 'connected' | 'disconnected' | 'data' | 'error' | 'waiting';

/* ── MqttSync class (MQTT loaded lazily) ─────────────────────────────── */

class MqttSync {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private listeners: Map<SyncEvent, Array<(...args: any[]) => void>> = new Map();
  private _peerId = '';
  private _isHost = false;
  private _isConnected = false;
  private _destroyed = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connectionTimeout: any = null;

  get peerId(): string { return this._peerId; }
  get isHost(): boolean { return this._isHost; }
  get isConnected(): boolean { return this._isConnected; }

  /* ── Event emitter helpers ──────────────────────────────── */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: SyncEvent, cb: (...args: any[]) => void): () => void {
    const arr = this.listeners.get(event) || [];
    arr.push(cb);
    this.listeners.set(event, arr);
    return () => {
      const a = this.listeners.get(event) || [];
      this.listeners.set(event, a.filter(fn => fn !== cb));
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(event: SyncEvent, ...args: any[]) {
    (this.listeners.get(event) || []).forEach(cb => cb(...args));
  }

  /* ── Generate a short, readable room code ───────────────── */

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  private topic(roomId: string, suffix: string): string {
    return `${TOPIC_PREFIX}${roomId}/${suffix}`;
  }

  /* ── Lazy load MQTT ─────────────────────────────────────── */

  private async loadMqtt() {
    // Dynamic import — only loads MQTT when sync is actually used
    const mqtt = await import('mqtt');
    return mqtt.default || mqtt;
  }

  /* ── HOST mode (PC / OBS overlay) ──────────────────────── */

  async createHost(): Promise<string> {
    if (this.client) this.destroy();
    this._destroyed = false;
    this._isHost = true;

    const roomId = this.generateRoomId();
    this._peerId = roomId;

    try {
      const mqtt = await this.loadMqtt();
      const clientId = `cargonavi-host-${roomId}-${Date.now()}`;

      const client = mqtt.connect(BROKER_URL, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        keepalive: 30,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Broker unreachable')), 8000);

        client.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      this.client = client;

      // Subscribe to data + status channels
      const dataTopic = this.topic(roomId, 'data');
      const statusTopic = this.topic(roomId, 'status');
      client.subscribe(dataTopic, { qos: 0 });
      client.subscribe(statusTopic, { qos: 0 });
      console.log('[MqttSync] Host subscribed to:', dataTopic);

      // Handle incoming messages
      client.on('message', (topic: string, payload: Buffer) => {
        try {
          const raw = JSON.parse(payload.toString());
          if (topic === statusTopic && raw?.type === 'client-joined') {
            console.log('[MqttSync] Client joined the room');
            this._isConnected = true;
            this.emit('connected');
            return;
          }
          if (topic === dataTopic && raw && typeof raw === 'object' && ['nav', 'twitch', 'weather'].includes(raw.type)) {
            this.emit('data', raw as SyncMessage);
          }
        } catch (e) {
          console.warn('[MqttSync] Invalid message:', e);
        }
      });

      // Heartbeat every 2s so clients can detect the room
      this.heartbeatTimer = setInterval(() => {
        if (client.connected) {
          client.publish(statusTopic, JSON.stringify({ type: 'host-ready', ts: Date.now() }), { qos: 0 });
        }
      }, 2000);

      // First heartbeat immediately (with retain so late-joining clients see it)
      client.publish(statusTopic, JSON.stringify({ type: 'host-ready', ts: Date.now() }), { qos: 0, retain: true });

      client.on('close', () => {
        this._isConnected = false;
        this.emit('disconnected');
      });

      client.on('error', (err: Error) => {
        console.error('[MqttSync] Host error:', err.message);
        this._isConnected = false;
        this.emit('error', err.message);
      });

      this.emit('waiting', roomId);
      return roomId;

    } catch (err: any) {
      console.error('[MqttSync] createHost failed:', err);
      this.destroy();
      throw new Error(err?.message || 'Could not create room');
    }
  }

  async regenerateRoom(): Promise<string> {
    console.log('[MqttSync] Regenerating room...');
    return this.createHost();
  }

  /* ── CLIENT mode (Phone / CoPilot) ─────────────────────── */

  async joinRoom(roomId: string): Promise<void> {
    if (this.client) this.destroy();
    this._destroyed = false;
    this._isHost = false;
    this._peerId = roomId;

    try {
      const mqtt = await this.loadMqtt();
      const clientId = `cargonavi-client-${roomId}-${Date.now()}`;

      const client = mqtt.connect(BROKER_URL, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        keepalive: 30,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Broker unreachable')), 8000);

        client.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        client.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      this.client = client;

      const statusTopic = this.topic(roomId, 'status');
      const dataTopic = this.topic(roomId, 'data');
      client.subscribe(statusTopic, { qos: 0 });
      client.subscribe(dataTopic, { qos: 0 });
      console.log('[MqttSync] Client subscribed to:', statusTopic);

      // Wait for host-ready (with timeout)
      await new Promise<void>((resolve, reject) => {
        this.connectionTimeout = setTimeout(() => {
          client.end(true);
          reject(new Error('Room not found. Make sure the OBS overlay is open on PC and the code matches.'));
        }, 5000);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onMessage = (topic: string, payload: Buffer) => {
          try {
            const msg = JSON.parse(payload.toString());
            if (topic === statusTopic && msg?.type === 'host-ready') {
              console.log('[MqttSync] Host room found!');
              if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
              }
            }
            if (topic === dataTopic && msg && typeof msg === 'object' && ['nav', 'twitch', 'weather'].includes(msg.type)) {
              this.emit('data', msg as SyncMessage);
            }
          } catch { /* ignore */ }
        };

        client.on('message', onMessage);

        // After 1.5s, resolve (we got the retained host-ready or timed out)
        setTimeout(() => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          // Tell host we're here
          client.publish(statusTopic, JSON.stringify({ type: 'client-joined', ts: Date.now() }), { qos: 0 });
          this._isConnected = true;
          this.emit('connected');
          resolve();
        }, 1500);
      });

      client.on('close', () => {
        this._isConnected = false;
        this.emit('disconnected');
      });

      client.on('error', (err: Error) => {
        console.error('[MqttSync] Client error:', err.message);
        this._isConnected = false;
        this.emit('error', err.message);
      });

    } catch (err: any) {
      this.destroy();
      throw new Error(err?.message || 'Connection failed');
    }
  }

  /* ── Send data ────────────────────────────────────────── */

  send(msg: SyncMessage): boolean {
    if (!this.client?.connected || !this._peerId) return false;
    try {
      this.client.publish(this.topic(this._peerId, 'data'), JSON.stringify(msg), { qos: 0 });
      return true;
    } catch {
      return false;
    }
  }

  /* ── Cleanup ──────────────────────────────────────────── */

  destroy() {
    this._destroyed = true;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.client) {
      try {
        if (this._isHost && this._peerId) {
          this.client.publish(this.topic(this._peerId, 'status'), '', { qos: 0, retain: true });
        }
      } catch { /* ignore */ }
      this.client.end(true);
      this.client = null;
    }
    this._isConnected = false;
    this._peerId = '';
    this._isHost = false;
    this.emit('disconnected');
    console.log('[MqttSync] Destroyed');
  }
}

/* ── Singleton export ─────────────────────────────────────── */

export const mqttSync = new MqttSync();

// Backward-compatible alias
export const peerSync = mqttSync;
