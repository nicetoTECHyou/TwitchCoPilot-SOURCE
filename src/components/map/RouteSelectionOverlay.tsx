'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Footprints, Shield, Navigation, Clock, Mountain, TrendingDown } from 'lucide-react';
import { useNavigationStore, type RouteResult } from '@/store/useNavigationStore';
import { t } from '@/lib/i18n';
import type { RouteInfo } from '@/types';

function getCategoryIcon(category: RouteResult['category']) {
  switch (category) {
    case 'shortest': return <Footprints className="size-4" />;
    case 'fastest': return <Zap className="size-4" />;
    case 'safest': return <Shield className="size-4" />;
  }
}

function getCategoryLabelKey(category: RouteResult['category']): string {
  switch (category) {
    case 'shortest': return 'nav.categoryShortest';
    case 'fastest': return 'nav.categoryFastest';
    case 'safest': return 'nav.categorySafest';
  }
}

function formatOverlayDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} ${t('nav.routeShort')}`;
  }
  return `${Math.round(meters)} ${t('general.m')}`;
}

function formatOverlayDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}${t('general.min')}`;
  }
  return `${minutes} ${t('general.min')}`;
}

export default function RouteSelectionOverlay() {
  const routeSelectionMode = useNavigationStore((s) => s.routeSelectionMode);
  const highlightedRouteIdx = useNavigationStore((s) => s.highlightedRouteIdx);
  const allRouteResults = useNavigationStore((s) => s.allRouteResults);
  const setHighlightedRouteIdx = useNavigationStore((s) => s.setHighlightedRouteIdx);
  const setRouteSelectionMode = useNavigationStore((s) => s.setRouteSelectionMode);
  const setRoute = useNavigationStore((s) => s.setRoute);
  const setIsNavigating = useNavigationStore((s) => s.setIsNavigating);
  const setRemainingDistance = useNavigationStore((s) => s.setRemainingDistance);
  const setAscent = useNavigationStore((s) => s.setAscent);
  const setDescent = useNavigationStore((s) => s.setDescent);
  const setEta = useNavigationStore((s) => s.setEta);

  if (!routeSelectionMode || allRouteResults.length === 0) return null;

  const handleRouteClick = (idx: number) => {
    const routeResult = allRouteResults[idx];
    if (!routeResult) return;

    setHighlightedRouteIdx(idx);

    // Set the selected route data in the store
    const routeInfo: RouteInfo = {
      distance: routeResult.distance,
      duration: routeResult.duration,
      ascent: routeResult.ascent,
      descent: routeResult.descent,
      geometry: routeResult.geometry,
    };
    setRoute(routeInfo);
  };

  const handleStartNav = () => {
    const routeResult = allRouteResults[highlightedRouteIdx >= 0 ? highlightedRouteIdx : 0];
    if (!routeResult) return;

    // Set navigation values like NavigateTab.handleStartNav
    setRoute({
      distance: routeResult.distance,
      duration: routeResult.duration,
      ascent: routeResult.ascent,
      descent: routeResult.descent,
      geometry: routeResult.geometry,
    });
    setRemainingDistance(routeResult.distance);
    setAscent(routeResult.ascent);
    setDescent(routeResult.descent);
    if (routeResult.duration > 0) {
      const h = Math.floor(routeResult.duration / 3600);
      const m = Math.round((routeResult.duration % 3600) / 60);
      setEta(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    setIsNavigating(true);
    setRouteSelectionMode(false);
  };

  const handleClose = () => {
    setRouteSelectionMode(false);
    setHighlightedRouteIdx(-1);
  };

  const selectedIdx = highlightedRouteIdx >= 0 ? highlightedRouteIdx : -1;
  const showStartButton = selectedIdx >= 0;

  return (
    <AnimatePresence>
      {routeSelectionMode && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[45] w-[calc(100vw-2rem)] max-w-lg"
        >
          <div className="glass rounded-xl p-3 shadow-xl">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-foreground/70">
                {t('nav.selectRoute')}
              </span>
              <button
                onClick={handleClose}
                className="size-6 rounded-md flex items-center justify-center hover:bg-foreground/10 transition-colors cursor-pointer text-foreground/50 hover:text-foreground"
                aria-label={t('general.close')}
              >
                <Navigation className="size-3 rotate-180" />
              </button>
            </div>

            {/* Route option buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allRouteResults.map((routeResult, idx) => {
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={`route-${idx}`}
                    onClick={() => handleRouteClick(idx)}
                    className={`
                      flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg
                      transition-all cursor-pointer min-w-[100px]
                      ${isSelected
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                      }
                    `}
                  >
                    {/* Category icon + label */}
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(routeResult.category)}
                      <span className="text-[10px] font-semibold">
                        {t(getCategoryLabelKey(routeResult.category))}
                      </span>
                    </div>

                    {/* Distance */}
                    <span className={`text-xs font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {formatOverlayDistance(routeResult.distance)}
                    </span>

                    {/* Duration */}
                    <div className="flex items-center gap-0.5 text-[10px] opacity-80">
                      <Clock className="size-2.5" />
                      <span>{formatOverlayDuration(routeResult.duration)}</span>
                    </div>

                    {/* Ascent/Descent */}
                    <div className="flex items-center gap-1.5 text-[9px] opacity-60">
                      <span className="flex items-center gap-0.5">
                        <Mountain className="size-2" />
                        {Math.round(routeResult.ascent)}m
                      </span>
                      <span className="flex items-center gap-0.5">
                        <TrendingDown className="size-2" />
                        {Math.round(routeResult.descent)}m
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Start navigation button */}
            <AnimatePresence>
              {showStartButton && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="overflow-hidden"
                >
                  <button
                    onClick={handleStartNav}
                    className="w-full mt-2 h-10 rounded-lg bg-success text-white font-semibold text-sm
                      hover:bg-success/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Navigation className="size-4" />
                    {t('nav.startNav')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
