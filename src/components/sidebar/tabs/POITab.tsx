
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, MapPin, Navigation, Plus, MapPinOff } from 'lucide-react';
import { t } from '@/lib/i18n';
import { usePOIStore } from '@/store/usePOIStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { POI_CATEGORY_CONFIG, type POICategory, type POI, type Waypoint } from '@/types';
import { fetchOverpass } from '@/lib/overpass';
import { mapInstanceRef } from '@/components/map/MapContainer';

// Map icon names to Lucide components
// Compact POI tag detail extractor
function getPOICompactDetails(poi: POI): string {
  const tags = poi.tags || {};
  const parts: string[] = [];
  const cat = poi.category;

  if (cat === 'charging') {
    if (tags.capacity) parts.push(`${tags.capacity} ${t('poi.places')}`);
    const sockets: string[] = [];
    if (tags['socket:type2']) sockets.push('Type2');
    if (tags['socket:ccs_combo']) sockets.push('CCS');
    if (tags['socket:chademo']) sockets.push('CHAdeMO');
    if (sockets.length) parts.push(sockets.join(', '));
    if (tags.operator) parts.push(tags.operator);
    if (tags.fee) parts.push(tags.fee === 'yes' ? t('poi.fee') : t('poi.free'));
  } else if (cat === 'restaurant' || cat === 'cafe') {
    if (tags.cuisine) parts.push(tags.cuisine);
    if (tags.phone) parts.push(tags.phone);
  } else if (cat === 'shopping' || cat === 'hardware') {
    if (tags.brand) parts.push(tags.brand);
    if (tags.phone) parts.push(tags.phone);
  } else if (cat === 'fuel') {
    if (tags.brand) parts.push(tags.brand);
    if (tags.opening_hours) parts.push(tags.opening_hours);
  } else if (cat === 'hospital') {
    if (tags.operator) parts.push(tags.operator);
    if (tags.phone) parts.push(tags.phone);
  } else if (cat === 'pharmacy') {
    if (tags.phone) parts.push(tags.phone);
    if (tags.dispensing === 'yes') parts.push(t('poi.emergencyService'));
  } else if (cat === 'bicycle_repair') {
    if (tags.brand) parts.push(tags.brand);
    if (tags.phone) parts.push(tags.phone);
  } else if (cat === 'camping' || cat === 'wildcamping') {
    if (tags.operator) parts.push(tags.operator);
    if (tags.fee) parts.push(tags.fee === 'yes' ? t('poi.fee') : t('poi.free'));
  }

  // Common fallbacks for all categories
  if (!parts.includes(tags.phone) && tags.phone) parts.push(tags.phone);
  if (tags.opening_hours && !parts.includes(tags.opening_hours)) {
    const shortOh = tags.opening_hours.length > 30 ? tags.opening_hours.substring(0, 27) + '...' : tags.opening_hours;
    parts.push(shortOh);
  }

  // Deduplicate and limit
  return [...new Set(parts)].slice(0, 3).join(' · ');
}

import {
  Zap,
  Tent,
  Camera,
  ShoppingCart,
  Wrench,
  Fuel,
  DoorOpen,
  Trees,
  Droplets,
  Bike,
  Cross,
  Pill,
  UtensilsCrossed,
  Coffee,
  Home,
  Hotel,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Tent,
  Camera,
  ShoppingCart,
  Wrench,
  Fuel,
  DoorOpen,
  Trees,
  Droplets,
  Bike,
  Cross,
  Pill,
  UtensilsCrossed,
  Coffee,
  Home,
  Hotel,
};

const POI_TAGS: Record<string, string[]> = {
  charging: ['amenity=charging_station'],
  camping: ['tourism=camp_site'],
  sightseeing: ['tourism=museum', 'tourism=attraction', 'tourism=castle', 'historic=castle', 'historic=monument'],
  shopping: ['shop=supermarket', 'shop=convenience'],
  hardware: ['shop=doityourself', 'shop=hardware'],
  fuel: ['amenity=fuel'],
  toilets: ['amenity=toilets'],
  wildcamping: ['tourism=camp_site'],
  water: ['amenity=drinking_water'],
  bicycle_repair: ['shop=bicycle', 'shop=bicycle_repair'],
  hospital: ['amenity=hospital'],
  pharmacy: ['amenity=pharmacy'],
  restaurant: ['amenity=restaurant'],
  cafe: ['amenity=cafe'],
  shelter: ['amenity=shelter'],
  hostel: ['tourism=hostel', 'tourism=hotel'],
};

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} ${t('general.km')}`;
  return `${Math.round(meters)} ${t('general.m')}`;
}

function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || MapPin;
}

// Default coordinates (Berlin center)
const DEFAULT_LAT = 52.52;
const DEFAULT_LON = 13.405;

export function POITab() {
  const {
    pois,
    activeCategories,
    searchQuery,
    isLoading,
    setPOIs,
    clearPOIs,
    toggleCategory,
    setSearchQuery,
    setIsLoading,
  } = usePOIStore();

  const { waypoints, addWaypoint, currentLat, currentLon } = useNavigationStore();
  const language = useSettingsStore((s) => s.language);

  const catLabel = (cat: POICategory) => {
    const c = POI_CATEGORY_CONFIG[cat];
    return language === 'de' ? c.labelDE : c.label;
  };
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track active categories count as a stable dependency for useEffect
  const activeCount = activeCategories.size;
  const activeKeys = [...activeCategories].join(',');

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Search POIs when query or categories change
  useEffect(() => {
    // Don't search when no categories are active and no text query
    if (activeCount === 0 && !debouncedQuery) {
      if (hasSearched) {
        setPOIs([]);
        setHasSearched(false);
      }
      return;
    }
    // Don't search when no categories active (text-only without filter = no results)
    if (activeCount === 0) {
      if (hasSearched) {
        setPOIs([]);
      }
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setHasSearched(true);

      try {
        // Use current map viewport as bounding box
        const map = mapInstanceRef.current;
        let bbox: string;
        if (map) {
          const bounds = map.getBounds();
          bbox = `${Number(bounds.getSouth()).toFixed(4)},${Number(bounds.getWest()).toFixed(4)},${Number(bounds.getNorth()).toFixed(4)},${Number(bounds.getEast()).toFixed(4)}`;
        } else {
          // Fallback: Berlin center ~1km
          bbox = `${(DEFAULT_LAT - 0.01).toFixed(4)},${(DEFAULT_LON - 0.015).toFixed(4)},${(DEFAULT_LAT + 0.01).toFixed(4)},${(DEFAULT_LON + 0.015).toFixed(4)}`;
        }

        // Build Overpass query — only use active categories
        const categories = Array.from(activeCategories) as POICategory[];

        // Determine relevant tags based on categories and query
        const tagsToSearch: string[] = [];
        categories.forEach((cat) => {
          if (POI_TAGS[cat]) {
            tagsToSearch.push(...POI_TAGS[cat]);
          }
        });

        if (tagsToSearch.length === 0) {
          setPOIs([]);
          setIsLoading(false);
          return;
        }

        // bbox already computed from map viewport above

        // Build tag filter - use nwr (nodes+ways+relations) for more results
        // Group by key to use regex matching (smaller query, avoids 400)
        const tagByKey: Record<string, string[]> = {};
        tagsToSearch.forEach((tag) => {
          const [key, value] = tag.split('=');
          if (!tagByKey[key]) tagByKey[key] = [];
          tagByKey[key].push(value);
        });

        const tagFilters = Object.entries(tagByKey)
          .map(([key, values]) => {
            const valRegex = values.join('|');
            return `nwr["${key}"~"^(${valRegex})$"](${bbox});`;
          })
          .join('\n');

        const query = `[out:json][timeout:25];
(
${tagFilters}
);
out body 200;`;

        let data: any;
        try {
          data = await fetchOverpass(query);
        } catch (err: any) {
          console.warn('[POITab] Overpass API error:', err.message);
          setPOIs([]);
          setIsLoading(false);
          return;
        }

        const elements = data.elements || [];

        // Map to POI objects (handle nodes, ways, and relations)
        let results: POI[] = elements.map((el: any, idx: number) => {
          const tags = el.tags || {};
          // For nodes: lat/lon directly; for ways/relations: center point
          let lat = el.lat || el.center?.lat;
          let lon = el.lon || el.center?.lon;
          // Some ways have bounds but no center - use centroid
          if (!lat && el.bounds) {
            lat = (el.bounds.minlat + el.bounds.maxlat) / 2;
            lon = (el.bounds.minlon + el.bounds.maxlon) / 2;
          }
          if (!lat || !lon) return null;

          // Determine category
          let category: POICategory = 'sightseeing';
          for (const [cat, catTags] of Object.entries(POI_TAGS)) {
            for (const ct of catTags) {
              const [key, value] = ct.split('=');
              if (tags[key] === value) {
                category = cat as POICategory;
                break;
              }
            }
          }

          // Calculate distance from current position
          const dLat = lat - (currentLat ?? DEFAULT_LAT);
          const dLon = lon - (currentLon ?? DEFAULT_LON);
          const distance = Math.sqrt(dLat * dLat + dLon * dLon) * 111320;

          return {
            id: `poi-${el.id || idx}`,
            name: tags.name || tags['name:en'] || tags['name:de'] || `${category} #${idx + 1}`,
            lat,
            lon,
            category,
            address: tags['addr:street']
              ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}, ${tags['addr:city'] || ''}`
              : undefined,
            distance,
            tags,
            description: tags.description || tags['description:en'] || tags['description:de'],
          };
        }).filter(Boolean) as POI[];

        // Filter by search query text
        if (debouncedQuery) {
          const q = debouncedQuery.toLowerCase();
          results = results.filter(
            (poi) =>
              poi.name.toLowerCase().includes(q) ||
              poi.address?.toLowerCase().includes(q) ||
              poi.description?.toLowerCase().includes(q)
          );
        }

        // Sort by distance
        results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

        setPOIs(results);
      } catch {
        setPOIs([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, activeCount, activeKeys, currentLat, currentLon, setPOIs, setIsLoading, hasSearched]);

  const handleAddAsDestination = useCallback(
    (poi: POI) => {
      const wp: Waypoint = {
        id: `dest-${Date.now()}`,
        lat: poi.lat,
        lon: poi.lon,
        name: poi.name,
        type: 'finish',
        address: poi.address,
      };
      const existing = waypoints.filter((w) => w.type !== 'finish');
      addWaypoint(wp);
      // Also update waypoints in store to replace finish
      useNavigationStore.getState().setWaypoints([...existing, wp]);
    },
    [waypoints, addWaypoint]
  );

  const handleAddAsVia = useCallback(
    (poi: POI) => {
      const wp: Waypoint = {
        id: `via-${Date.now()}`,
        lat: poi.lat,
        lon: poi.lon,
        name: poi.name,
        type: 'via',
        address: poi.address,
      };
      addWaypoint(wp);
    },
    [addWaypoint]
  );

  const allCategories = Object.keys(POI_CATEGORY_CONFIG) as POICategory[];

  return (
    <ScrollArea className="h-full custom-scrollbar">
    <div className="flex flex-col gap-3 p-3 pb-8 max-w-full overflow-hidden">
      {/* Search field */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-sidebar-foreground/30" />
        <Input
          placeholder={t('poi.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 text-sm pl-9 bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground"
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />
        )}
      </div>

      {/* Category filter buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {allCategories.map((cat) => {
          const config = POI_CATEGORY_CONFIG[cat];
          const IconComp = getIconComponent(config.icon);
          const isActive = activeCategories.has(cat);

          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              title={catLabel(cat)}
              className={`
                flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg text-[10px] leading-tight
                border transition-all duration-150
                ${
                  isActive
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground/50 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground/70'
                }
              `}
            >
              <IconComp className="size-3.5 shrink-0" />
              <span className="truncate w-full text-center">{catLabel(cat).split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Active category count indicator */}
      {activeCategories.size > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-sidebar-foreground/40">
            {t('poi.activeFilters', { n: activeCategories.size })}
          </span>
          <button
            className="text-[10px] text-primary hover:text-primary/80 transition-colors"
            onClick={() => {
              allCategories.forEach((cat) => {
                if (activeCategories.has(cat)) toggleCategory(cat);
              });
            }}
          >
            {t('poi.clearAll')}
          </button>
        </div>
      )}

      {/* POI results list */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full overflow-hidden custom-scrollbar">
        <div className="space-y-1.5 pb-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="size-6 text-primary animate-spin" />
              <span className="text-xs text-sidebar-foreground/40">{t('poi.loading')}</span>
            </div>
          )}

          {!isLoading && hasSearched && pois.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <MapPinOff className="size-6 text-sidebar-foreground/20" />
              <span className="text-xs text-sidebar-foreground/40">{t('poi.noResults')}</span>
            </div>
          )}

          {!isLoading && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <MapPin className="size-6 text-sidebar-foreground/20" />
              <span className="text-xs text-sidebar-foreground/30 text-center">
                {t('poi.hint')}
              </span>
            </div>
          )}

          {pois.map((poi) => {
            const config = POI_CATEGORY_CONFIG[poi.category];
            const IconComp = getIconComponent(config.icon);

            return (
              <div
                key={poi.id}
                className="p-2.5 rounded-lg bg-sidebar-foreground/5 border border-sidebar-border hover:bg-sidebar-foreground/10 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    <IconComp className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{poi.name}</span>
                      {poi.distance !== undefined && (
                        <span className="text-[10px] text-sidebar-foreground/40 shrink-0">
                          {formatDistance(poi.distance)}
                        </span>
                      )}
                    </div>
                    {poi.address && (
                      <div className="text-[10px] text-sidebar-foreground/40 truncate mt-0.5">
                        {poi.address}
                      </div>
                    )}
                    {(() => {
                      const details = getPOICompactDetails(poi);
                      if (!details) return null;
                      return (
                        <div className="text-[10px] text-sidebar-foreground/50 truncate mt-0.5">
                          {details}
                        </div>
                      );
                    })()}
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => handleAddAsDestination(poi)}
                      >
                        <Navigation className="size-3" />
                        {t('poi.asDestination')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                        onClick={() => handleAddAsVia(poi)}
                      >
                        <Plus className="size-3" />
                        {t('poi.via')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </ScrollArea>
      </div>
    </div>
    </ScrollArea>
  );
}
