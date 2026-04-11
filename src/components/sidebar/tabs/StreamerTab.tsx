
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Shield,
  MessageSquare,
  Bell,
  Hash,
  Ban,
  Search,
  Clock,
  User,
  Loader2,
  ToggleLeft,
  Navigation,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { useTwitchStore } from '@/store/useTwitchStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { TwitchAlert, BotCommand } from '@/types';

// Default system alerts
const DEFAULT_ALERTS: TwitchAlert[] = [
  { id: 'alert-follow', type: 'follow', message: '{user} just followed! Welcome!', enabled: true, color: '#9146FF', volume: 80, duration: 5 },
  { id: 'alert-sub', type: 'subscribe', message: '{user} subscribed! Thank you!', enabled: true, color: '#00D4AA', volume: 80, duration: 5 },
  { id: 'alert-bits', type: 'bits', message: '{user} cheered {amount} bits!', enabled: true, color: '#FFD700', volume: 80, duration: 5 },
  { id: 'alert-raid', type: 'raid', message: '{user} is raiding with {viewers} viewers!', enabled: true, color: '#FF6B35', volume: 90, duration: 5 },
  { id: 'alert-gifted', type: 'gifted_sub', message: '{user} gifted a sub to {target}!', enabled: false, color: '#FF69B4', volume: 70, duration: 5 },
];

// Default system commands — ALL built-in commands visible for permission management
const DEFAULT_COMMANDS: BotCommand[] = [
  // Info commands
  { id: 'cmd-help', trigger: '!help', responses: ['Shows all available commands'], cooldown: 10, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-commands', trigger: '!commands', responses: ['Shows available commands'], cooldown: 10, accessLevel: 'everyone', isActive: true, aliases: ['!cmds'], isSystem: true },
  { id: 'cmd-version', trigger: '!version', responses: ['Shows current build version'], cooldown: 30, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-rank', trigger: '!rank', responses: ['Shows your command usage rank'], cooldown: 15, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  // Navigation commands
  { id: 'cmd-position', trigger: '!position', responses: ['Shows current GPS position'], cooldown: 10, accessLevel: 'everyone', isActive: true, aliases: ['!pos', '!gps'], isSystem: true },
  { id: 'cmd-stats', trigger: '!stats', responses: ['Shows current trip statistics'], cooldown: 15, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-route', trigger: '!route', responses: ['Shows current route info'], cooldown: 15, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-navi', trigger: '!navi', responses: ['{user} suggests a navigation waypoint'], cooldown: 30, accessLevel: 'follower', isActive: true, aliases: [], isSystem: true },
  // Weather & POI commands
  { id: 'cmd-wetter', trigger: '!wetter', responses: ['Shows weather at current GPS position'], cooldown: 20, accessLevel: 'everyone', isActive: true, aliases: ['!weather'], isSystem: true },
  { id: 'cmd-poi', trigger: '!poi', responses: ['Searches for nearby POIs by category'], cooldown: 30, accessLevel: 'everyone', isActive: true, aliases: ['!find'], isSystem: true },
  { id: 'cmd-notfall', trigger: '!notfall', responses: ['Finds nearby hospitals and police'], cooldown: 60, accessLevel: 'everyone', isActive: true, aliases: ['!emergency', '!emergency'], isSystem: true },
  { id: 'cmd-sightseeing', trigger: '!sightseeing', responses: ['Finds nearby sightseeing spots'], cooldown: 30, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-camping', trigger: '!camping', responses: ['Finds nearby campsites'], cooldown: 30, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-ladesaeule', trigger: '!ladesaeule', responses: ['Finds nearby charging stations'], cooldown: 30, accessLevel: 'everyone', isActive: true, aliases: ['!charging'], isSystem: true },
  // Voting
  { id: 'cmd-vote', trigger: '!vote', responses: ['Start/vote in live polls'], cooldown: 10, accessLevel: 'everyone', isActive: true, aliases: [], isSystem: true },
  // TTS & Translation
  { id: 'cmd-tts', trigger: '!tts', responses: ['Speaks text via Text-to-Speech'], cooldown: 30, accessLevel: 'subscriber', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-tts-t', trigger: '!tts-t', responses: ['Translates text and speaks it'], cooldown: 30, accessLevel: 'subscriber', isActive: true, aliases: [], isSystem: true },
  { id: 'cmd-translate', trigger: '!translate', responses: ['Universal translator: !translate <lang> [text] | !translate off'], cooldown: 15, accessLevel: 'everyone', isActive: true, aliases: ['!translator', '!übersetzer'], isSystem: true },
];

function AlertIcon({ type }: { type: TwitchAlert['type'] }) {
  switch (type) {
    case 'follow': return <User className="size-3.5" />;
    case 'subscribe': return <Bell className="size-3.5" />;
    case 'bits': return <Hash className="size-3.5" />;
    case 'raid': return <MessageSquare className="size-3.5" />;
    case 'gifted_sub': return <ToggleLeft className="size-3.5" />;
    default: return <Bell className="size-3.5" />;
  }
}

export function StreamerTab() {
  const {
    connected,
    alerts: storeAlerts,
    commands: storeCommands,
    messages,
    bans,
    setAlerts,
    addAlert,
    updateAlert,
    deleteAlert,
    setCommands,
    addCommand,
    updateCommand,
    deleteCommand,
    addBan,
  } = useTwitchStore();

  const {
    twitchChannel,
    twitchBotName,
    twitchToken,
    autoConnect,
    autoApprove,
    updateSetting,
  } = useSettingsStore();

  // Connection state - initialized from settings store
  const [channelInput, setChannelInput] = useState(twitchChannel || '');
  const [botInput, setBotInput] = useState(twitchBotName || '');
  const [tokenInput, setTokenInput] = useState(twitchToken || '');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Dialog states
  const [editAlertDialog, setEditAlertDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<TwitchAlert | null>(null);
  const [alertForm, setAlertForm] = useState<Partial<TwitchAlert>>({});

  const [addCommandDialog, setAddCommandDialog] = useState(false);
  const [editCommandDialog, setEditCommandDialog] = useState(false);
  const [editingCommand, setEditingCommand] = useState<BotCommand | null>(null);
  const [commandForm, setCommandForm] = useState<Partial<BotCommand>>({});

  const [banDialog, setBanDialog] = useState(false);
  const [banningUser, setBanningUser] = useState('');
  const [banReason, setBanReason] = useState('');

  // Moderation search
  const [banSearch, setBanSearch] = useState('');

  // Ensure default alerts/commands on first render
  React.useEffect(() => {
    if (storeAlerts.length === 0) {
      setAlerts(DEFAULT_ALERTS);
    }
    if (storeCommands.length === 0) {
      setCommands(DEFAULT_COMMANDS);
    }
  }, [storeAlerts.length, storeCommands.length, setAlerts, setCommands]);

  const handleConnect = useCallback(() => {
    if (!channelInput || !botInput || !tokenInput) return;

    setIsConnecting(true);

    // Save connection info to settings store (which TwitchChatManager watches)
    updateSetting('twitchChannel', channelInput);
    updateSetting('twitchBotName', botInput);
    updateSetting('twitchToken', tokenInput);

    // Also sync to twitch store directly so TwitchChatManager has the values immediately
    useTwitchStore.getState().setConnectionInfo(channelInput, botInput, tokenInput);

    // Trigger real connection via TwitchChatManager's store-registered function
    setTimeout(() => {
      const connectFn = useTwitchStore.getState()._connectFn;
      if (connectFn) {
        connectFn();
      }
      setIsConnecting(false);
    }, 300);
  }, [channelInput, botInput, tokenInput, updateSetting]);

  const handleDisconnect = useCallback(() => {
    const disconnectFn = useTwitchStore.getState()._disconnectFn;
    if (disconnectFn) {
      disconnectFn();
    }
  }, []);

  // Alert handlers
  const handleEditAlert = useCallback((alert: TwitchAlert) => {
    setEditingAlert(alert);
    setAlertForm({ ...alert });
    setEditAlertDialog(true);
  }, []);

  const handleSaveAlert = useCallback(() => {
    if (editingAlert && alertForm) {
      updateAlert(editingAlert.id, alertForm);
    } else if (alertForm) {
      addAlert({
        id: `alert-${Date.now()}`,
        type: alertForm.type || 'follow',
        message: alertForm.message || '',
        enabled: alertForm.enabled ?? true,
        color: alertForm.color,
        volume: alertForm.volume ?? 80,
        duration: alertForm.duration ?? 5,
        ttsRate: alertForm.ttsRate,
        ttsVoice: alertForm.ttsVoice,
        soundUrl: alertForm.soundUrl || '',
      });
    }
    setEditAlertDialog(false);
    setEditingAlert(null);
    setAlertForm({});
  }, [editingAlert, alertForm, updateAlert, addAlert]);

  const handleAddAlert = useCallback(() => {
    setEditingAlert(null);
    setAlertForm({ type: 'follow', message: '{user} just followed!', enabled: true, volume: 80, duration: 5, color: '#9146FF', soundUrl: '' });
    setEditAlertDialog(true);
  }, []);

  // Command handlers
  const handleEditCommand = useCallback((cmd: BotCommand) => {
    setEditingCommand(cmd);
    setCommandForm({ ...cmd });
    setEditCommandDialog(true);
  }, []);

  const handleSaveCommand = useCallback(() => {
    if (editingCommand && commandForm) {
      updateCommand(editingCommand.id, commandForm);
    } else if (commandForm) {
      addCommand({
        id: `cmd-${Date.now()}`,
        trigger: commandForm.trigger || '!custom',
        responses: commandForm.responses || ['Response'],
        cooldown: commandForm.cooldown ?? 30,
        accessLevel: commandForm.accessLevel || 'everyone',
        isActive: commandForm.isActive ?? true,
        aliases: commandForm.aliases || [],
        isSystem: false,
      });
    }
    setEditCommandDialog(false);
    setAddCommandDialog(false);
    setEditingCommand(null);
    setCommandForm({});
  }, [editingCommand, commandForm, updateCommand, addCommand]);

  const handleAddCommand = useCallback(() => {
    setEditingCommand(null);
    setCommandForm({ trigger: '!', responses: [''], cooldown: 30, accessLevel: 'everyone', isActive: true, aliases: [] });
    setAddCommandDialog(true);
  }, []);

  const handleDeleteCommand = useCallback((id: string) => {
    deleteCommand(id);
  }, [deleteCommand]);

  // Ban handlers
  const handleBanUser = useCallback((username: string) => {
    setBanningUser(username);
    setBanReason('');
    setBanDialog(true);
  }, []);

  const handleConfirmBan = useCallback(() => {
    if (!banningUser) return;
    // Ban is recorded locally; Twitch TMI ban requires a separate integration
    addBan({
      id: `ban-${Date.now()}`,
      username: banningUser,
      reason: banReason || t('settings.noReason'),
      bannedBy: twitchBotName || 'Bot',
      timestamp: Date.now(),
      isActive: true,
    });
    setBanDialog(false);
    setBanningUser('');
    setBanReason('');
  }, [banningUser, banReason, twitchBotName, addBan]);

  const handleDeleteMessage = useCallback((_msgId: string) => {
    // Message deletion via Twitch TMI requires a separate integration
  }, []);

  const filteredBans = bans.filter((b) =>
    (b.username || '').toLowerCase().includes(banSearch.toLowerCase()) ||
    (b.reason || '').toLowerCase().includes(banSearch.toLowerCase())
  );

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollArea className="h-full custom-scrollbar">
    <div className="flex flex-col gap-3 p-3 pb-8 max-w-full overflow-hidden">
      {/* Connection section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-sidebar-foreground/70">{t('twitch.connection')}</Label>
          <Badge
            variant={connected ? 'default' : 'outline'}
            className={`text-[10px] h-5 ${
              connected
                ? 'bg-success/20 text-success border-success/30'
                : 'border-sidebar-border text-sidebar-foreground/50'
            }`}
          >
            {connected ? t('twitch.connected') : t('twitch.disconnected')}
          </Badge>
        </div>

        <form
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
          action="javascript:void(0)"
          className="space-y-1.5"
        >
          <Input
            placeholder={t('twitch.channel')}
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground"
            disabled={connected}
            autoComplete="off"
            data-form-type="other"
          />
          <Input
            placeholder={t('twitch.bot')}
            value={botInput}
            onChange={(e) => setBotInput(e.target.value)}
            className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground"
            disabled={connected}
            autoComplete="off"
            data-form-type="other"
          />
          <div className="relative">
            <Input
              placeholder={t('twitch.token')}
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className={`h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground pr-9 ${!showToken ? '[-webkit-text-security:disc] [-moz-text-security:disc]' : ''}`}
              disabled={connected}
              autoComplete="off"
              data-form-type="other"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
              onClick={() => setShowToken(!showToken)}
              tabIndex={-1}
            >
              {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </form>

        <div className="flex gap-2">
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={!channelInput || !botInput || !tokenInput || isConnecting}
              className="flex-1 h-8 text-xs gap-1.5 bg-success text-white hover:bg-success/90"
            >
              {isConnecting ? <Loader2 className="size-3.5 animate-spin" /> : <Wifi className="size-3.5" />}
              {t('twitch.connect')}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="flex-1 h-8 text-xs gap-1.5 border-danger/50 text-danger hover:bg-danger/10"
            >
              <WifiOff className="size-3.5" />
              {t('twitch.disconnect')}
            </Button>
          )}
          <div className="flex items-center gap-1.5 px-2">
            <Label className="text-[10px] text-sidebar-foreground/50">{t('twitch.autoConnect')}</Label>
            <Switch
              checked={autoConnect}
              onCheckedChange={(v) => updateSetting('autoConnect', v)}
              className="scale-75"
            />
          </div>
        </div>
      </div>

      {/* Navigation waypoint settings */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-1.5">
          <Navigation className="size-3.5 text-sidebar-foreground/50" />
          <Label className="text-[10px] text-sidebar-foreground/50">{t('twitch.autoApproveWaypoints')}</Label>
        </div>
        <Switch
          checked={autoApprove}
          onCheckedChange={(v) => updateSetting('autoApprove', v)}
          className="scale-75"
        />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Sub-tabs */}
      <Tabs defaultValue="alerts" className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsList className="w-full h-8 bg-sidebar-foreground/10 rounded-lg p-1 shrink-0">
          <TabsTrigger
            value="alerts"
            className="flex-1 gap-1 text-[11px] h-6 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Bell className="size-3" />
            {t('bot.alerts')}
          </TabsTrigger>
          <TabsTrigger
            value="commands"
            className="flex-1 gap-1 text-[11px] h-6 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Hash className="size-3" />
            {t('bot.commands')}
          </TabsTrigger>
          <TabsTrigger
            value="moderation"
            className="flex-1 gap-1 text-[11px] h-6 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Shield className="size-3" />
            {t('bot.moderation')}
          </TabsTrigger>
        </TabsList>

        {/* Alerts sub-tab */}
        <TabsContent value="alerts" className="flex-1 overflow-y-auto mt-2 min-h-0 custom-scrollbar">
          <ScrollArea className="h-full custom-scrollbar">
            <div className="space-y-2 pb-4">
              {storeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-sidebar-foreground/5 border border-sidebar-border hover:bg-sidebar-foreground/10 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${alert.color}20`, color: alert.color }}>
                    <AlertIcon type={alert.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                      <Badge variant="outline" className={`text-[9px] h-4 px-1 ${alert.enabled ? 'border-success/30 text-success' : 'border-sidebar-border text-sidebar-foreground/40'}`}>
                        {alert.enabled ? t('bot.enabled') : t('bot.disabled')}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-sidebar-foreground/50 truncate">{alert.message}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={(v) => updateAlert(alert.id, { enabled: v })}
                      className="scale-60"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditAlert(alert)}>
                      <Pencil className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 border-dashed border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground hover:border-sidebar-foreground/30"
                onClick={handleAddAlert}
              >
                <Plus className="size-3.5" />
                {t('alert.addAlert')}
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Commands sub-tab */}
        <TabsContent value="commands" className="flex-1 overflow-y-auto mt-2 min-h-0 custom-scrollbar">
          <ScrollArea className="h-full custom-scrollbar">
            <div className="space-y-2 pb-4">
              {storeCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="p-2.5 rounded-lg bg-sidebar-foreground/5 border border-sidebar-border hover:bg-sidebar-foreground/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Hash className="size-3 text-primary" />
                      <span className="text-xs font-mono font-medium">{cmd.trigger}</span>
                      {cmd.isSystem && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">
                          {t('bot.system')}
                        </Badge>
                      )}
                      {!cmd.isActive && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-danger/30 text-danger">
                          {t('general.off')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Switch
                        checked={cmd.isActive}
                        onCheckedChange={(v) => updateCommand(cmd.id, { isActive: v })}
                        className="scale-60"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCommand(cmd)}>
                        <Pencil className="size-3" />
                      </Button>
                      {!cmd.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-danger/60 hover:text-danger"
                          onClick={() => handleDeleteCommand(cmd.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-sidebar-foreground/50 truncate">{cmd.responses[0]}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-sidebar-foreground/40">
                    <span className="flex items-center gap-0.5"><Clock className="size-2.5" />{cmd.cooldown}s</span>
                    <span>{t('access.' + cmd.accessLevel)}</span>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 border-dashed border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground hover:border-sidebar-foreground/30"
                onClick={handleAddCommand}
              >
                <Plus className="size-3.5" />
                {t('alert.addCommand')}
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Moderation sub-tab */}
        <TabsContent value="moderation" className="flex-1 overflow-y-auto mt-2 min-h-0 custom-scrollbar">
          <ScrollArea className="h-full custom-scrollbar">
            <div className="space-y-3 pb-4">
              {/* Recent messages */}
              <div>
                <Label className="text-[10px] text-sidebar-foreground/50 mb-1.5 block">{t('moderation.recentMessages')}</Label>
                {messages.length === 0 ? (
                  <div className="text-xs text-sidebar-foreground/30 text-center py-4">
                    {t('moderation.noMessages')}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {messages.slice(-20).reverse().map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-sidebar-foreground/5 text-xs hover:bg-sidebar-foreground/10 transition-colors group"
                      >
                        <span className="font-medium shrink-0" style={{ color: msg.color || undefined }}>
                          {msg.displayName}
                        </span>
                        <span className="flex-1 text-sidebar-foreground/70 truncate">{msg.message}</span>
                        <span className="text-[10px] text-sidebar-foreground/30 shrink-0">{formatTime(msg.timestamp)}</span>
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-danger/60 hover:text-danger"
                            onClick={() => handleBanUser(msg.username)}
                            title={t('bot.ban')}
                          >
                            <Ban className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-sidebar-foreground/40 hover:text-sidebar-foreground"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title={t('bot.delete')}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-sidebar-border" />

              {/* Ban history */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('moderation.banHistory')}</Label>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-sidebar-border">
                    {bans.length}
                  </Badge>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-sidebar-foreground/30" />
                  <Input
                    placeholder={t('moderation.searchBans')}
                    value={banSearch}
                    onChange={(e) => setBanSearch(e.target.value)}
                    className="h-7 text-[10px] pl-7 bg-sidebar-foreground/5 border-sidebar-border"
                  />
                </div>

                {filteredBans.length === 0 ? (
                  <div className="text-xs text-sidebar-foreground/30 text-center py-3">
                    {banSearch ? t('moderation.noMatchingBans') : t('moderation.noBans')}
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredBans.slice().reverse().map((ban) => (
                      <div
                        key={ban.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-danger/5 border border-danger/10 text-xs"
                      >
                        <Ban className="size-3 text-danger shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-danger">{ban.username}</span>
                          <span className="text-sidebar-foreground/40 ml-1">- {ban.reason}</span>
                        </div>
                        <span className="text-[10px] text-sidebar-foreground/30 shrink-0">
                          {formatTime(ban.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Edit Alert Dialog */}
      <Dialog open={editAlertDialog} onOpenChange={setEditAlertDialog}>
        <DialogContent className="bg-surface border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sidebar-foreground">
              {editingAlert ? t('bot.edit') : t('bot.add')} {t('alert.type').toLowerCase()}
            </DialogTitle>
            <DialogDescription>
              {editingAlert ? t('alert.modifyAlert') : t('alert.createNewAlert')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('alert.type')}</Label>
              <Select
                value={alertForm.type}
                onValueChange={(v) => setAlertForm({ ...alertForm, type: v as TwitchAlert['type'] })}
              >
                <SelectTrigger className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow">{t('alert.follow')}</SelectItem>
                  <SelectItem value="subscribe">{t('alert.subscribe')}</SelectItem>
                  <SelectItem value="bits">{t('alert.bits')}</SelectItem>
                  <SelectItem value="raid">{t('alert.raid')}</SelectItem>
                  <SelectItem value="gifted_sub">{t('alert.giftedSub')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('alert.messageTemplate')}</Label>
              <Textarea
                value={alertForm.message || ''}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                placeholder={t('alert.placeholder')}
                className="text-xs bg-sidebar-foreground/5 border-sidebar-border min-h-[60px]"
              />
              <div className="text-[10px] text-sidebar-foreground/40">{t('alert.placeholder')}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('alert.color')}</Label>
              <div className="flex gap-2">
                {['#9146FF', '#00D4AA', '#FFD700', '#FF6B35', '#FF69B4', '#E74C3C'].map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${alertForm.color === c ? 'scale-110 border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setAlertForm({ ...alertForm, color: c })}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('alert.soundUrl')}</Label>
              <Input
                value={alertForm.soundUrl || ''}
                onChange={(e) => setAlertForm({ ...alertForm, soundUrl: e.target.value })}
                placeholder="https://example.com/alert.mp3"
                className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border"
              />
              <div className="text-[10px] text-sidebar-foreground/40">{t('alert.soundUrlHint')}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('alert.volume')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={alertForm.volume ?? 80}
                  onChange={(e) => setAlertForm({ ...alertForm, volume: Number(e.target.value) })}
                  className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('alert.duration')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={alertForm.duration ?? 5}
                  onChange={(e) => setAlertForm({ ...alertForm, duration: Number(e.target.value) })}
                  className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditAlertDialog(false)}>
              {t('bot.cancel')}
            </Button>
            <Button size="sm" onClick={handleSaveAlert} className="bg-primary text-primary-foreground">
              {t('bot.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Command Dialog */}
      <Dialog open={addCommandDialog || editCommandDialog} onOpenChange={(open) => { setAddCommandDialog(open); setEditCommandDialog(open); }}>
        <DialogContent className="bg-surface border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sidebar-foreground">
              {editingCommand ? t('bot.edit') : t('bot.add')} {t('command.trigger').toLowerCase()}
            </DialogTitle>
            <DialogDescription>
              {editingCommand ? t('command.modifyCommand') : t('command.createCommand')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('command.trigger')}</Label>
              <Input
                value={commandForm.trigger || ''}
                onChange={(e) => setCommandForm({ ...commandForm, trigger: e.target.value })}
                placeholder="!mycommand"
                className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border"
                disabled={!!editingCommand?.isSystem}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('command.responses')}</Label>
              <Textarea
                value={(commandForm.responses || []).join('\n')}
                onChange={(e) => setCommandForm({ ...commandForm, responses: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Response line 1&#10;Response line 2"
                className="text-xs bg-sidebar-foreground/5 border-sidebar-border min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('command.cooldown')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={600}
                  value={commandForm.cooldown ?? 30}
                  onChange={(e) => setCommandForm({ ...commandForm, cooldown: Number(e.target.value) })}
                  className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('command.accessLevel')}</Label>
                <Select
                  value={commandForm.accessLevel}
                  onValueChange={(v) => setCommandForm({ ...commandForm, accessLevel: v as BotCommand['accessLevel'] })}
                >
                  <SelectTrigger className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">{t('access.everyone')}</SelectItem>
                    <SelectItem value="follower">{t('access.follower')}</SelectItem>
                    <SelectItem value="vip">{t('access.vip')}</SelectItem>
                    <SelectItem value="subscriber">{t('access.subscriber')}</SelectItem>
                    <SelectItem value="mod">{t('access.mod')}</SelectItem>
                    <SelectItem value="broadcaster">{t('access.broadcaster')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setAddCommandDialog(false); setEditCommandDialog(false); }}
            >
              {t('bot.cancel')}
            </Button>
            <Button size="sm" onClick={handleSaveCommand} className="bg-primary text-primary-foreground">
              {t('bot.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialog} onOpenChange={setBanDialog}>
        <DialogContent className="bg-surface border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sidebar-foreground">{t('moderation.banUser')}</DialogTitle>
            <DialogDescription>
              {t('moderation.banUser')} <span className="font-semibold text-danger">{banningUser}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('moderation.banReason')}</Label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={t('moderation.banReason')}
                className="h-8 text-xs bg-sidebar-foreground/5 border-sidebar-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setBanDialog(false)}>
              {t('bot.cancel')}
            </Button>
            <Button size="sm" onClick={handleConfirmBan} className="bg-danger text-white hover:bg-danger/90">
              <Ban className="size-3.5 mr-1" />
              {t('moderation.confirmBan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ScrollArea>
  );
}
