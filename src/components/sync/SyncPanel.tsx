import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Copy, Check, Link2, Unplug, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSyncStore } from '@/store/useSyncStore';
import { peerSync } from '@/lib/peerSync';
import { t } from '@/lib/i18n';

/**
 * SyncPanel — OBS Connect/Disconnect UI.
 * Placed in the Settings tab on the phone side.
 */
export function SyncPanel() {
  const { isConnected, error, peerId } = useSyncStore();
  const [roomId, setRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!roomId.trim()) return;
    setJoining(true);
    useSyncStore.getState().setError(null);
    try {
      await peerSync.joinRoom(roomId.trim().toUpperCase());
      useSyncStore.getState().setConnected(true);
      useSyncStore.getState().setPeerId(roomId.trim().toUpperCase());
    } catch (err: any) {
      useSyncStore.getState().setError(err?.message || t('sync.connectionFailed'));
    } finally {
      setJoining(false);
    }
  };

  const handleDisconnect = () => {
    peerSync.destroy();
    useSyncStore.getState().reset();
    setRoomId('');
  };

  const handleCopy = async () => {
    const id = useSyncStore.getState().peerId;
    if (id) {
      try {
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback
      }
    }
  };

  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-semibold text-sidebar-foreground">
            {t('sync.connected')}
          </span>
        </div>
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-xs text-sidebar-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sidebar-foreground/50">{t('sync.roomCode')}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-success">{peerId}</span>
              <button onClick={handleCopy} className="text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors">
                {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-sidebar-foreground/40">{t('sync.connectedHint')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs gap-1.5 border-danger/50 text-danger hover:bg-danger/10 hover:text-danger"
          onClick={handleDisconnect}
        >
          <Unplug className="size-3.5" />
          {t('sync.disconnect')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 text-sidebar-foreground/40" />
        <span className="text-xs font-medium text-sidebar-foreground/70">
          {t('sync.connectToOBS')}
        </span>
      </div>

      <div className="bg-sidebar-foreground/5 border border-sidebar-border rounded-lg p-3 text-xs text-sidebar-foreground/60 space-y-2">
        <p>{t('sync.howToConnect')}</p>
        <ol className="list-decimal list-inside space-y-1 text-sidebar-foreground/40">
          <li>{t('sync.step1')}</li>
          <li>{t('sync.step2')}</li>
          <li>{t('sync.step3')}</li>
        </ol>
      </div>

      <div className="flex gap-1.5">
        <Input
          placeholder="XXXXXX"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          className="h-8 text-sm bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground font-mono tracking-wider"
          maxLength={6}
          disabled={joining}
        />
        <Button
          size="sm"
          className="h-8 px-3 gap-1.5 bg-success text-white hover:bg-success/90"
          onClick={handleJoin}
          disabled={!roomId.trim() || joining}
        >
          {joining ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <Link2 className="size-3.5" />
              {t('sync.connect')}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg flex items-start gap-2">
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span>{error}</span>
            {error.includes('Room not found') && (
              <p className="text-sidebar-foreground/40 text-[10px]">
                {t('sync.troubleshootHint')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * OverlaySyncBadge — Shown on the OBS overlay page.
 * Displays the room code when waiting, or connection status when connected.
 */
export function OverlaySyncBadge() {
  const { peerId, isConnected, error } = useSyncStore();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const newId = await peerSync.regenerateRoom();
      useSyncStore.getState().setPeerId(newId);
      useSyncStore.getState().setConnected(false);
      useSyncStore.getState().setError(null);
    } catch (err) {
      console.error('[OverlaySyncBadge] Failed to regenerate room:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(peerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  if (isConnected) {
    return (
      <div className="absolute top-2 right-4 z-[10000]">
        <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-1.5 border border-green-500/30 flex items-center gap-1.5 pointer-events-none select-none">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-400 font-medium">SYNCED</span>
        </div>
      </div>
    );
  }

  if (!peerId) return null;

  return (
    <div className="absolute inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
      <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-purple-500/30 p-8 max-w-sm w-full mx-4 text-center space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Wifi className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-white/90">OBS Sync</span>
          </div>
          <p className="text-xs text-white/50">
            {t('sync.overlayHint')}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <span className="text-[10px] text-red-300/80 text-left">{error}</span>
          </div>
        )}

        <div
          className="bg-white/5 rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={handleCopy}
        >
          <div className="text-4xl font-black tracking-[0.3em] text-purple-400 font-mono">
            {peerId}
          </div>
          <div className="flex items-center justify-center gap-1 mt-2 text-white/30">
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-[10px]">{t('sync.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">{t('sync.tapToCopy')}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-[10px] text-white/30">
          {t('sync.enterInApp')}
        </p>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full flex items-center justify-center gap-2 text-[10px] text-white/40 hover:text-white/60 transition-colors py-1.5 rounded-lg border border-white/5 hover:border-white/10"
        >
          {regenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {t('sync.newCode')}
        </button>

        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-purple-500/50 rounded-full animate-pulse" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
