
import { Volume2, VolumeX } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { t } from '@/lib/i18n';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function MuteButton() {
  const voiceEnabled = useSettingsStore((s) => s.voiceEnabled);
  const voiceVolume = useSettingsStore((s) => s.voiceVolume);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const toggleMute = () => {
    updateSetting('voiceEnabled', !voiceEnabled);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleMute}
            className="glass rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-foreground/10 transition-all active:scale-95"
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5 text-accent" />
            ) : (
              <VolumeX className="w-5 h-5 text-danger" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="glass text-xs">
          {voiceEnabled
            ? `${t('settings.volume')}: ${voiceVolume}%`
            : `${t('settings.voice')} ${t('general.off')}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
