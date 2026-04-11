
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, ChevronUp, ChevronDown, Send } from 'lucide-react';
import { useTwitchStore } from '@/store/useTwitchStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

export default function ChatOverlay() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useTwitchStore((s) => s.messages);
  const connected = useTwitchStore((s) => s.connected);
  const channel = useTwitchStore((s) => s.channel);
  const language = useSettingsStore((s) => s.language);

  const displayMessages = isExpanded ? messages.slice(-20) : messages.slice(-3);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages.length, messages.length]);

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const twitchStore = useTwitchStore.getState();
    // Connection guard is inside _sendChatFn/sendChat — only check existence
    if (twitchStore._sendChatFn) {
      twitchStore._sendChatFn(trimmed);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col transition-all duration-300"
      style={{
        width: isExpanded ? 'min(360px, calc(100vw - 2rem))' : 'min(360px, calc(100vw - 2rem))',
        maxHeight: isExpanded ? '240px' : '100px',
      }}
    >
      {/* Header bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass rounded-t-xl px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-foreground/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t('twitch.chat')} - {channel || '---'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Messages area */}
      <div className="glass rounded-b-xl overflow-hidden flex flex-col">
        <div
          ref={scrollRef}
          className={`custom-scrollbar overflow-y-auto px-3 py-2 space-y-1 transition-all duration-300 ${
            isExpanded ? 'max-h-[140px]' : 'max-h-[50px]'
          }`}
        >
          {displayMessages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-4">
              {connected ? t('chat.waiting') : t('twitch.disconnected')}
            </div>
          )}
          {displayMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 text-sm leading-tight py-0.5 ${
                msg.username === 'system' ? 'opacity-90' : ''
              }`}
            >
              <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap pt-0.5">
                {formatTime(msg.timestamp)}
              </span>
              <span
                className="font-semibold whitespace-nowrap text-xs"
                style={{ color: msg.color || '#fff' }}
              >
                {msg.username === 'system' ? msg.displayName : msg.username}:
              </span>
              <span className="text-foreground/90 text-xs break-words">
                {msg.message}
              </span>
            </div>
          ))}
        </div>

        {/* Input field (only when expanded) */}
        {isExpanded && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? t('chat.sendMessage') : t('chat.notConnected')}
              disabled={!connected}
              className="h-8 text-xs bg-foreground/5 border-border rounded-lg focus-visible:ring-primary"
            />
            <Button
              onClick={handleSend}
              disabled={!connected || !inputValue.trim()}
              size="sm"
              className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
