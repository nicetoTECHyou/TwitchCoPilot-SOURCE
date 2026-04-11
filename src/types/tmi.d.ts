declare module 'tmi.js' {
  export interface Options {
    identity?: {
      username: string;
      password: string;
    };
    channels: string[];
    options?: {
      debug?: boolean;
    };
    connection?: {
      reconnect?: boolean;
      secure?: boolean;
    };
  }

  export class Client {
    constructor(opts: Options);

    connect(): Promise<[string, number]>;
    disconnect(): Promise<void>;
    say(channel: string, message: string): Promise<[string]>;
    join(channel: string): Promise<[string]>;
    part(channel: string): Promise<[string]>;

    on(event: string, callback: (...args: any[]) => void): this;

    /** Whether the client is currently connected to the IRC server */
    connected: boolean;

    /** Internal: Check if WebSocket is connected (ws.readyState === 1) */
    _isConnected(): boolean;

    getOptions(): {
      channels: string[];
      identity?: {
        username: string;
      };
    };
  }
}
