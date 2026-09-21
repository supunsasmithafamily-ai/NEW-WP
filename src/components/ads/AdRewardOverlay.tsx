'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Play, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/lib/store';

const AD_COINS = 50;          // Coins per ad watch
const MAX_ADS_PER_DAY = 10;   // Maximum daily ad views
const SKIP_AFTER_SECONDS = 5; // Seconds before skip button appears
const AD_TOTAL_SECONDS = 15;  // Total ad duration before reward

const STORAGE_KEY = 'wp_ad_state';

interface AdState {
  date: string;          // 'YYYY-MM-DD' — resets daily
  adsWatchedToday: number;
  lastDailyBonusDone: boolean;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadAdState(): AdState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AdState;
      if (parsed.date === todayStr()) return parsed;
    }
  } catch { /* ignore */ }
  return { date: todayStr(), adsWatchedToday: 0, lastDailyBonusDone: false };
}

function saveAdState(state: AdState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

interface Props {
  /** Pass true to trigger after login so the daily-bonus flow also runs */
  afterLogin?: boolean;
  onClose: () => void;
}

export default function AdRewardOverlay({ afterLogin, onClose }: Props) {
  const { user } = useAuth();
  const { setCoinBalance } = useWalletStore();

  const [adState, setAdState] = useState<AdState>(loadAdState());
  const [phase, setPhase] = useState<'offer' | 'watching' | 'done' | 'limit'>('offer');
  const [secondsLeft, setSecondsLeft] = useState(AD_TOTAL_SECONDS);
  const [canSkip, setCanSkip] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [dailyBonusDone, setDailyBonusDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);

  // Claim daily login bonus (called once per day, after first ad or standalone)
  const claimDailyBonus = useCallback(async () => {
    if (!user?.uid || adState.lastDailyBonusDone) return;
    try {
      const res = await fetch('/api/coins/daily-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setCoinBalance(data.newBalance);
        setDailyBonusDone(true);
        const updated = { ...adState, lastDailyBonusDone: true };
        setAdState(updated);
        saveAdState(updated);
      }
    } catch { /* non-critical */ }
  }, [user, adState, setCoinBalance]);

  // Load HilltopAds script into the ad container
  const loadAd = useCallback(() => {
    if (!adContainerRef.current) return;
    adContainerRef.current.innerHTML = '';

    // HilltopAds in-page push or interstitial banner
    // Replace ZONE_ID with your actual HilltopAds zone ID from your account
    const script = document.createElement('script');
    script.async = true;
    script.src = '//jsc.hilltopads.net/ZONE_ID.js'; // ← replace ZONE_ID
    script.setAttribute('data-cfasync', 'false');
    adContainerRef.current.appendChild(script);

    // Fallback visible placeholder in case the script hasn't loaded / is
    // blocked (ad blockers) — the timer and coin reward still run so the
    // user experience degrades gracefully.
    const fallback = document.createElement('div');
    fallback.style.cssText =
      'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;';
    fallback.innerHTML =
      '<span style="color:#8696A0;font-size:12px;">Advertisement</span>' +
      '<span style="color:#4a5568;font-size:11px;">(Ad content loads here)</span>';
    adContainerRef.current.appendChild(fallback);
  }, []);

  const startWatching = useCallback(() => {
    if (adState.adsWatchedToday >= MAX_ADS_PER_DAY) {
      setPhase('limit');
      return;
    }
    setPhase('watching');
    setSecondsLeft(AD_TOTAL_SECONDS);
    setCanSkip(false);
    loadAd();

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed++;
      setSecondsLeft(AD_TOTAL_SECONDS - elapsed);
      if (elapsed === SKIP_AFTER_SECONDS) setCanSkip(true);
      if (elapsed >= AD_TOTAL_SECONDS) {
        clearInterval(timerRef.current!);
        handleAdComplete();
      }
    }, 1000);
  }, [adState.adsWatchedToday, loadAd]);

  const handleAdComplete = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch('/api/coins/ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setCoinBalance(data.newBalance);
        setCoinsEarned(AD_COINS);
      }
    } catch { /* non-critical — still show the success screen */ }

    const updated: AdState = {
      ...adState,
      adsWatchedToday: adState.adsWatchedToday + 1,
    };
    setAdState(updated);
    saveAdState(updated);
    setPhase('done');

    // Also claim daily login bonus on the first ad of the day
    if (!adState.lastDailyBonusDone) {
      await claimDailyBonus();
    }
  }, [user, adState, setCoinBalance, claimDailyBonus]);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    clearInterval(timerRef.current!);
    handleAdComplete();
  }, [canSkip, handleAdComplete]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Auto-claim daily bonus on login even without watching an ad
  useEffect(() => {
    if (afterLogin && !adState.lastDailyBonusDone && user?.uid) {
      claimDailyBonus();
    }
  }, [afterLogin, user]);

  const adsLeft = MAX_ADS_PER_DAY - adState.adsWatchedToday;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/70 flex items-end justify-center"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg bg-[#111B21] rounded-t-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Gift className="w-4.5 h-4.5 text-[#FFD700]" />
              <span className="text-white text-sm font-semibold">Watch Ads → Earn Coins</span>
            </div>
            {phase !== 'watching' && (
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            {/* OFFER */}
            {phase === 'offer' && (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#FFD700,#FFA500)' }}
                >
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Earn {AD_COINS} coins per ad</p>
                  <p className="text-white/50 text-xs mt-1">Up to {MAX_ADS_PER_DAY} ads per day</p>
                  {adsLeft > 0 ? (
                    <p className="text-[#25D366] text-xs mt-0.5">{adsLeft} ads remaining today</p>
                  ) : (
                    <p className="text-red-400 text-xs mt-0.5">No more ads available today</p>
                  )}
                </div>
                <button
                  onClick={startWatching}
                  disabled={adsLeft === 0}
                  className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#000' }}
                >
                  <Play className="w-4 h-4 inline mr-1.5" />
                  Watch Ad ({adsLeft}/{MAX_ADS_PER_DAY} left)
                </button>
                <button onClick={onClose} className="text-white/30 text-xs">Skip for now</button>
              </div>
            )}

            {/* WATCHING */}
            {phase === 'watching' && (
              <div className="flex flex-col gap-3">
                {/* Ad container */}
                <div
                  ref={adContainerRef}
                  className="w-full rounded-xl overflow-hidden bg-[#1F2C34]"
                  style={{ minHeight: '200px' }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/50 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{secondsLeft}s</span>
                  </div>
                  <button
                    onClick={handleSkip}
                    disabled={!canSkip}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      canSkip
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {canSkip ? 'Skip →' : `Skip in ${SKIP_AFTER_SECONDS - (AD_TOTAL_SECONDS - secondsLeft)}s`}
                  </button>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#25D366] transition-all duration-1000"
                    style={{ width: `${((AD_TOTAL_SECONDS - secondsLeft) / AD_TOTAL_SECONDS) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* DONE */}
            {phase === 'done' && (
              <div className="flex flex-col items-center gap-4 py-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
                >
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">
                    +{coinsEarned} coins earned!
                  </p>
                  {dailyBonusDone && (
                    <p className="text-[#FFD700] text-xs mt-0.5">+100 daily login bonus!</p>
                  )}
                  <p className="text-white/40 text-xs mt-1">
                    {MAX_ADS_PER_DAY - adState.adsWatchedToday} more ads available today
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  {adState.adsWatchedToday < MAX_ADS_PER_DAY && (
                    <button
                      onClick={startWatching}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#000' }}
                    >
                      Watch Another
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* LIMIT */}
            {phase === 'limit' && (
              <div className="flex flex-col items-center gap-4 py-3">
                <span className="text-4xl">⏰</span>
                <div className="text-center">
                  <p className="text-white font-semibold">Daily limit reached</p>
                  <p className="text-white/40 text-xs mt-1">
                    You've watched {MAX_ADS_PER_DAY} ads today. Come back tomorrow!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
