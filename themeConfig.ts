export const AFFILIATE_THEMES = {
    default: { label: 'Default (Gray)', classes: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700' },
    orange: { label: 'Orange (Amazon)', classes: 'bg-[#FF9900] hover:bg-[#ffad33] text-slate-900 border-[#e68a00]' },
    red: { label: 'Red (Target)', classes: 'bg-red-600 hover:bg-red-700 text-white border-red-700' },
    blue: { label: 'Blue (Walmart)', classes: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700' },
    green: { label: 'Green (Whole Foods)', classes: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700' },
    purple: { label: 'Purple', classes: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700' },
} as const;

export type AffiliateTheme = keyof typeof AFFILIATE_THEMES;
