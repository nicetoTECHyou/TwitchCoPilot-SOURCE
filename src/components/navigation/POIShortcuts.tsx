
import {
  Zap,
  Tent,
  Camera,
  ShoppingCart,
  Fuel,
  Droplets,
  Bike,
  Cross,
} from 'lucide-react';
import { usePOIStore } from '@/store/usePOIStore';
import { POI_CATEGORY_CONFIG, type POICategory } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SHORTCUT_CATEGORIES: POICategory[] = [
  'charging',
  'camping',
  'sightseeing',
  'shopping',
  'fuel',
  'water',
  'bicycle_repair',
  'hospital',
];

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Tent,
  Camera,
  ShoppingCart,
  Fuel,
  Droplets,
  Bike,
  Cross,
};

export default function POIShortcuts() {
  const activeCategories = usePOIStore((s) => s.activeCategories);
  const toggleCategory = usePOIStore((s) => s.toggleCategory);
  const language = useSettingsStore((s) => s.language);

  const catLabel = (cat: POICategory) => {
    const c = POI_CATEGORY_CONFIG[cat];
    return language === 'de' ? c.labelDE : c.label;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-1.5">
        {SHORTCUT_CATEGORIES.map((cat) => {
          const config = POI_CATEGORY_CONFIG[cat];
          const isActive = activeCategories.has(cat);
          const Icon = ICON_MAP[config.icon] || Zap;

          return (
            <Tooltip key={cat}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggleCategory(cat)}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 group ${
                    isActive
                      ? ''
                      : 'glass'
                  }`}
                  style={isActive ? {
                    background: `${config.color}22`,
                    border: `2px solid ${config.color}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  } : undefined}
                >
                  <Icon
                    className="w-4 h-4 transition-colors text-muted-foreground"
                    style={{ color: isActive ? config.color : undefined }}
                  />
                  {isActive && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background"
                      style={{ background: config.color }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs glass">
                <span style={{ color: config.color }}>{catLabel(cat)}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
