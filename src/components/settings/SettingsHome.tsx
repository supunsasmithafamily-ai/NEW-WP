'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Bell,
  BellRing,
  Gift,
  Monitor,
  Wallet,
  Globe,
  Trash2,
  Info,
  ChevronRight,
  Camera,
  Palette,
  Moon,
  Sun,
  LogOut,
  User,
  Pencil,
  WalletMinimal,
  FileText,
  ArrowDownToLine,
} from 'lucide-react';
import { GlassmorphismCard } from '@/components/three/GlassmorphismCard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────
interface SettingItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
  destructive?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingItem[];
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Animation Variants ───────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

// ─── Main Component ───────────────────────────────────
export default function SettingsHome() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayUser = {
    displayName: user?.displayName || 'User',
    email: user?.email || '',
    initials: getInitials(user?.displayName || 'User'),
    color: '#075E54',
  };

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(displayUser.displayName);
  const [editPhotoURL, setEditPhotoURL] = useState(user?.photoURL || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');

  const [settings, setSettings] = useState({
    // Privacy
    showOnline: true,
    readReceipts: true,
    profilePhotoVisible: true,
    // Notifications
    pushNotifications: true,
    liveStreamAlerts: true,
    giftNotifications: true,
    // Streaming
    allowGifts: true,
    // App
    darkMode: true,
  });

  const toggleSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ═══════════════════════════════════════════════════════
  //  Placeholder Click Handlers
  //  (Connect these to Firebase / real logic later)
  // ═══════════════════════════════════════════════════════

  const handleEditProfile = useCallback(() => {
    setEditName(displayUser.displayName);
    setEditPhotoURL(user?.photoURL || '');
    setProfileSaveError('');
    setShowEditProfile(true);
  }, [displayUser.displayName, user]);

  const handleSaveProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setProfileSaveError('Name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    setProfileSaveError('');
    try {
      await updateProfile(auth.currentUser, {
        displayName: trimmedName,
        photoURL: editPhotoURL.trim() || null,
      });
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        { displayName: trimmedName, photoURL: editPhotoURL.trim() || null },
        { merge: true }
      );
      setShowEditProfile(false);
    } catch (err) {
      setProfileSaveError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  }, [editName, editPhotoURL]);

  const handlePhoneClick = useCallback(() => {
    alert('Phone number editing is coming soon.');
  }, []);

  const handleEmailClick = useCallback(() => {
    alert(`Your account email is ${displayUser.email || 'not set'}. Email editing is coming soon.`);
  }, [displayUser.email]);

  const handle2FAClick = useCallback(() => {
    alert('Two-factor authentication is coming soon.');
  }, []);

  const handleStreamQualityClick = useCallback(() => {
    alert('Stream quality selection is coming soon — streams currently use a standard automatic quality.');
  }, []);

  const handleMinGiftValueClick = useCallback(() => {
    alert('Setting a minimum gift value is coming soon.');
  }, []);

  const handleConnectedWalletsClick = useCallback(() => {
    alert('Connected wallet management is coming soon. You can withdraw coins directly from the Wallet tab.');
  }, []);

  const handleTransactionHistoryClick = useCallback(() => {
    router.push('/');
    // The Wallet tab already shows real recent transactions — a dedicated
    // full-history page can be added as a follow-up if needed.
  }, [router]);

  const handleWithdrawalSettingsClick = useCallback(() => {
    alert('Withdrawal network/wallet configuration is coming soon. You can withdraw coins directly from the Wallet tab.');
  }, []);

  const handleLanguageClick = useCallback(() => {
    alert('Language selection is coming soon — the app currently runs in English/Sinhala mixed UI.');
  }, []);

  const handleClearCacheClick = useCallback(async () => {
    const confirmed = confirm(
      'Clear Cache?\n\nThis will clear locally stored data and log you out.\n\nThis action cannot be undone.'
    );
    if (confirmed) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Storage access can fail in some restricted browser contexts — ignore.
      }
      await logout();
      router.push('/login');
    }
  }, [logout, router]);

  const handleAboutClick = useCallback(() => {
    alert('About Wp-earn-money\n\nA WhatsApp-inspired mobile-first PWA with live streaming, virtual gifts, and a coin economy.\n\nPowered by Next.js, Firebase, Agora, and OxaPay.');
  }, []);

  const handleLogoutClick = useCallback(async () => {
    const confirmed = confirm(
      'Log Out?\n\nYou will need to sign in again to access your chats, wallet, and live streams.'
    );
    if (confirmed) {
      await logout();
      router.push('/login');
    }
  }, [logout, router]);

  // ─── Settings Groups ────────────────────────────────
  const groups: SettingsGroup[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'phone',
          label: 'Phone Number',
          icon: <Phone className="w-[18px] h-[18px]" style={{ color: '#128C7E' }} />,
          value: 'Not set',
          onClick: handlePhoneClick,
        },
        {
          id: 'email',
          label: 'Email',
          icon: <Mail className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          value: displayUser.email,
          onClick: handleEmailClick,
        },
        {
          id: '2fa',
          label: 'Two-Factor Auth',
          icon: <ShieldCheck className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          value: 'Disabled',
          onClick: handle2FAClick,
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          id: 'showOnline',
          label: 'Who Can See Me Online',
          icon: <Eye className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          value: 'Everyone',
          toggle: true,
          toggleValue: settings.showOnline,
          onToggle: (v) => toggleSetting('showOnline', v),
        },
        {
          id: 'readReceipts',
          label: 'Read Receipts',
          icon: <EyeOff className="w-[18px] h-[18px]" style={{ color: '#8696A0' }} />,
          toggle: true,
          toggleValue: settings.readReceipts,
          onToggle: (v) => toggleSetting('readReceipts', v),
        },
        {
          id: 'profilePhotoVisible',
          label: 'Profile Photo Visibility',
          icon: <Camera className="w-[18px] h-[18px]" style={{ color: '#805DE2' }} />,
          value: 'Everyone',
          toggle: true,
          toggleValue: settings.profilePhotoVisible,
          onToggle: (v) => toggleSetting('profilePhotoVisible', v),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'pushNotifications',
          label: 'Push Notifications',
          icon: <Bell className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          toggle: true,
          toggleValue: settings.pushNotifications,
          onToggle: (v) => toggleSetting('pushNotifications', v),
        },
        {
          id: 'liveStreamAlerts',
          label: 'Live Stream Alerts',
          icon: <BellRing className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          toggle: true,
          toggleValue: settings.liveStreamAlerts,
          onToggle: (v) => toggleSetting('liveStreamAlerts', v),
        },
        {
          id: 'giftNotifications',
          label: 'Gift Notifications',
          icon: <Gift className="w-[18px] h-[18px]" style={{ color: '#FF6B6B' }} />,
          toggle: true,
          toggleValue: settings.giftNotifications,
          onToggle: (v) => toggleSetting('giftNotifications', v),
        },
      ],
    },
    {
      title: 'Streaming',
      items: [
        {
          id: 'defaultQuality',
          label: 'Default Stream Quality',
          icon: <Monitor className="w-[18px] h-[18px]" style={{ color: '#128C7E' }} />,
          value: 'Auto',
          onClick: handleStreamQualityClick,
        },
        {
          id: 'allowGifts',
          label: 'Allow Gifts on Stream',
          icon: <Gift className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          toggle: true,
          toggleValue: settings.allowGifts,
          onToggle: (v) => toggleSetting('allowGifts', v),
        },
        {
          id: 'minGiftValue',
          label: 'Minimum Gift Value',
          icon: <Gift className="w-[18px] h-[18px]" style={{ color: '#8696A0' }} />,
          value: '10 coins',
          onClick: handleMinGiftValueClick,
        },
      ],
    },
    {
      title: 'Wallet',
      items: [
        {
          id: 'connectedWallets',
          label: 'Connected Wallets',
          icon: <Wallet className="w-[18px] h-[18px]" style={{ color: '#805DE2' }} />,
          value: '1 wallet',
          onClick: handleConnectedWalletsClick,
        },
        {
          id: 'transactionHistory',
          label: 'Transaction History',
          icon: <Wallet className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          onClick: handleTransactionHistoryClick,
        },
        {
          id: 'withdrawalSettings',
          label: 'Withdrawal Settings',
          icon: <Wallet className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          onClick: handleWithdrawalSettingsClick,
        },
      ],
    },
    {
      title: 'App',
      items: [
        {
          id: 'theme',
          label: 'Theme',
          icon: settings.darkMode
            ? <Moon className="w-[18px] h-[18px]" style={{ color: '#128C7E' }} />
            : <Sun className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          value: settings.darkMode ? 'Dark' : 'Light',
          toggle: true,
          toggleValue: settings.darkMode,
          onToggle: (v) => toggleSetting('darkMode', v),
        },
        {
          id: 'language',
          label: 'Language',
          icon: <Globe className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          value: 'English',
          onClick: handleLanguageClick,
        },
        {
          id: 'clearCache',
          label: 'Clear Cache',
          icon: <Trash2 className="w-[18px] h-[18px]" style={{ color: '#EA4335' }} />,
          destructive: true,
          onClick: handleClearCacheClick,
        },
        {
          id: 'about',
          label: 'About',
          icon: <Info className="w-[18px] h-[18px]" style={{ color: '#8696A0' }} />,
          onClick: handleAboutClick,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-4" style={{ background: '#111B21' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {/* ── Profile Section ── */}
        <motion.div variants={itemVariants}>
          <GlassmorphismCard className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <button
              onClick={handleEditProfile}
              className="group relative shrink-0"
              aria-label="Edit profile picture"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-[#25D366]/50"
                style={{
                  background: `linear-gradient(135deg, ${displayUser.color}, #128C7E)`,
                  color: '#fff',
                  boxShadow: `0 4px 16px ${displayUser.color}40`,
                }}
              >
                {displayUser.initials}
              </div>
              {/* Camera overlay on hover */}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <Pencil className="w-4 h-4 text-white" />
              </div>
            </button>

            <button className="flex-1 min-w-0 bg-transparent border-0 p-0 cursor-pointer text-left" onClick={handleEditProfile}>
              <h2 className="text-base font-semibold truncate" style={{ color: '#E9EDEF' }}>
                {displayUser.displayName}
              </h2>
              <p className="text-sm truncate" style={{ color: '#8696A0' }}>
                {displayUser.email}
              </p>
            </button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleEditProfile}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95"
              style={{
                background: 'rgba(7,94,84,0.3)',
                border: '1px solid rgba(18,140,126,0.4)',
                color: '#25D366',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(7,94,84,0.55)';
                e.currentTarget.style.borderColor = 'rgba(37,211,102,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(7,94,84,0.3)';
                e.currentTarget.style.borderColor = 'rgba(18,140,126,0.4)';
              }}
              aria-label="Edit Profile"
            >
              Edit Profile
            </motion.button>
          </GlassmorphismCard>
        </motion.div>

        {/* ── Settings Groups ── */}
        {groups.map((group, groupIndex) => (
          <motion.div key={group.title} variants={itemVariants} className="mb-5">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
              style={{ color: '#8696A0' }}
            >
              {group.title}
            </h3>
            <GlassmorphismCard noPadding hover={false}>
              {group.items.map((item, itemIndex) => {
                const isClickable = !!item.onClick || (item.toggle && !!item.onToggle);

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isClickable}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150"
                    style={{
                      borderBottom:
                        itemIndex < group.items.length - 1
                          ? '1px solid rgba(255,255,255,0.06)'
                          : 'none',
                      cursor: isClickable ? 'pointer' : 'default',
                      background: 'transparent',
                      borderLeft: 'none',
                      borderTop: 'none',
                      borderRight: 'none',
                    }}
                    onClick={() => {
                      if (item.toggle && item.onToggle) {
                        item.onToggle(!item.toggleValue);
                      } else if (item.onClick) {
                        item.onClick();
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.background =
                          'rgba(255,255,255,0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    aria-label={item.label}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      {item.icon}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm"
                        style={{
                          color: item.destructive ? '#EA4335' : '#E9EDEF',
                        }}
                      >
                        {item.label}
                      </p>
                    </div>

                    {/* Right side: Toggle, Value+Chevron, or just Chevron */}
                    {item.toggle ? (
                      <div
                        className="w-10 h-[22px] rounded-full p-0.5 transition-all duration-200 shrink-0"
                        style={{
                          background: item.toggleValue
                            ? 'linear-gradient(135deg, #25D366, #128C7E)'
                            : 'rgba(255,255,255,0.15)',
                          justifyContent: item.toggleValue
                            ? 'flex-end'
                            : 'flex-start',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="w-[18px] h-[18px] rounded-full transition-all duration-200 shadow-sm"
                          style={{
                            background: item.toggleValue ? '#fff' : '#8696A0',
                          }}
                        />
                      </div>
                    ) : item.value ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-xs"
                          style={{ color: '#8696A0' }}
                        >
                          {item.value}
                        </span>
                        <ChevronRight
                          className="w-4 h-4"
                          style={{ color: '#667781' }}
                        />
                      </div>
                    ) : (
                      <ChevronRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: '#667781' }}
                      />
                    )}
                  </button>
                );
              })}
            </GlassmorphismCard>
          </motion.div>
        ))}

        {/* ── Admin Panel (visible only to the admin account) ── */}
        {user?.email === 'supunsasmithafamily@gmail.com' && (
          <motion.div variants={itemVariants} className="mb-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/admin')}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'rgba(37,211,102,0.1)',
                border: '1px solid rgba(37,211,102,0.25)',
                color: '#25D366',
              }}
            >
              <ShieldCheck className="w-[18px] h-[18px]" />
              Admin Panel
            </motion.button>
          </motion.div>
        )}

        {/* ── Log Out ── */}
        <motion.div variants={itemVariants} className="mb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogoutClick}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            style={{
              background: 'rgba(234,67,53,0.08)',
              border: '1px solid rgba(234,67,53,0.2)',
              color: '#EA4335',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(234,67,53,0.16)';
              e.currentTarget.style.borderColor = 'rgba(234,67,53,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(234,67,53,0.08)';
              e.currentTarget.style.borderColor = 'rgba(234,67,53,0.2)';
            }}
          >
            <LogOut className="w-[18px] h-[18px]" />
            Log Out
          </motion.button>
        </motion.div>

        {/* ── Version ── */}
        <motion.div variants={itemVariants} className="text-center pb-4">
          <p className="text-[11px]" style={{ color: '#667781' }}>
            App Version 1.0.0
          </p>
        </motion.div>
      </motion.div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => !savingProfile && setShowEditProfile(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl p-5"
            style={{ background: '#1F2C34' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-4" style={{ color: '#E9EDEF' }}>
              Edit Profile
            </h3>

            {profileSaveError && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#FCA5A5' }}
              >
                {profileSaveError}
              </div>
            )}

            <label className="block text-xs mb-1.5" style={{ color: '#8696A0' }}>
              Display Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mb-4 px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#2A3942', color: '#E9EDEF' }}
              maxLength={50}
            />

            <label className="block text-xs mb-1.5" style={{ color: '#8696A0' }}>
              Photo URL (optional)
            </label>
            <input
              type="text"
              value={editPhotoURL}
              onChange={(e) => setEditPhotoURL(e.target.value)}
              placeholder="https://..."
              className="w-full mb-5 px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#2A3942', color: '#E9EDEF' }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditProfile(false)}
                disabled={savingProfile}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#2A3942', color: '#E9EDEF' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: '#25D366', color: '#0B141A' }}
              >
                {savingProfile ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
