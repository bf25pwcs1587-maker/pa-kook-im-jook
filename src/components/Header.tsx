import React from 'react';
import { 
  ShoppingCart, 
  CalendarDays, 
  BarChart3, 
  UtensilsCrossed, 
  Type, 
  RotateCcw,
  CloudCheck,
  Database
} from 'lucide-react';
import { FontSizeSetting } from '../types';
import { translations, Language } from '../utils/translations';

interface HeaderProps {
  activeTab: 'pos' | 'daily' | 'monthly' | 'menu';
  setActiveTab: (tab: 'pos' | 'daily' | 'monthly' | 'menu') => void;
  fontSize: FontSizeSetting;
  setFontSize: (size: FontSizeSetting) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onResetData: () => void;
  onOpenDbModal?: () => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  fontSize,
  setFontSize,
  lang,
  setLang,
  onResetData,
  onOpenDbModal,
  cartCount,
}) => {
  const t = translations[lang];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top Row: Brand & Quick Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Shop Title with Pa-Kook-Im-Jook */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 font-bold text-2xl">
              🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{t.appTitle}</span>
                  <button
                    type="button"
                    onClick={onOpenDbModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-full transition cursor-pointer"
                    title={lang === 'th' ? 'คลิกเพื่อดูสถานะฐานข้อมูล & การส่งมอบให้ลูกค้า (Clean Slate)' : 'Click to inspect Cloud Database & Customer Handover'}
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">{t.databaseConnected}</span>
                    <span className="sm:hidden">DB</span>
                  </button>
                </h1>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Right Tools: Font Size Toggle, Language Switcher, Reset */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Font Size Selector (Crucial for "little bit larg fornt used") */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700/80 shadow-inner">
              <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.fontSizeLabel}:</span>
              </span>
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={t.fontNormal}
              >
                {t.fontNormal}
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={t.fontLarge}
              >
                {t.fontLarge}
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`px-2.5 py-1 rounded-lg text-sm sm:text-base font-extrabold transition-all cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={t.fontXLarge}
              >
                {t.fontXLarge}
              </button>
            </div>

            {/* Language Switcher (Thai / English) */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setLang('th')}
                className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1 cursor-pointer ${
                  lang === 'th'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="ภาษาไทย (Thai)"
              >
                <span>🇹🇭</span>
                <span>ไทย</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English language"
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>

            {/* Reset sample data */}
            <button
              type="button"
              onClick={onResetData}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs font-medium border border-slate-700/60 transition flex items-center gap-1 cursor-pointer"
              title={t.resetDataBtn}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.resetDataBtn}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs with Large Clickable Buttons */}
        <nav className="flex items-center gap-1 sm:gap-2 mt-3 pt-2.5 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base whitespace-nowrap cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <span>{t.tabPOS}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base whitespace-nowrap cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span>{t.tabDaily}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base whitespace-nowrap cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>{t.tabMonthly}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base whitespace-nowrap cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span>{t.tabMenu}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
