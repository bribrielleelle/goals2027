import React from 'react';
import {
  Check,
  Download,
  Palette,
  RotateCcw,
  Sparkles,
  Type,
  X,
} from 'lucide-react';
import {
  ACCENT_SWATCHES,
  ART_GALLERY,
  STICKER_PACK,
  THEMES,
} from '../data/presets';
import {
  FontStyleId,
  RadiusStyle,
  RailStyle,
  ThemeDefinition,
  ThemeId,
  WorkspaceSettings,
} from '../types/planner';

interface CustomizerDrawerProps {
  open: boolean;
  theme: ThemeDefinition;
  settings: WorkspaceSettings;
  hasActivePage: boolean;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<WorkspaceSettings>) => void;
  onAddStickerToActivePage?: (sticker: string) => void;
  onExportWorkspace: () => void;
  onResetWorkspace: () => void;
}

export const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({
  open,
  theme,
  settings,
  hasActivePage,
  onClose,
  onUpdateSettings,
  onAddStickerToActivePage,
  onExportWorkspace,
  onResetWorkspace,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden shadow-2xl"
        style={{
          backgroundColor: theme.surfaceBg,
          borderLeft: `1px solid ${theme.borderColor}`,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${theme.borderColor}` }}
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" style={{ color: theme.accent }} />
            <h2 className="font-display text-base font-bold">
              Customize Workspace
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizer"
            className="rounded-lg p-1.5 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Studio Controls */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold" style={{ color: theme.textMuted }}>
              Workspace Identity
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="text-[11px]" style={{ color: theme.textMuted }}>
                  Space Name
                </label>
                <input
                  type="text"
                  value={settings.workspaceName}
                  onChange={(e) =>
                    onUpdateSettings({ workspaceName: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                />
              </div>
              <div>
                <label className="text-[11px]" style={{ color: theme.textMuted }}>
                  Initials
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={settings.userInitials}
                  onChange={(e) =>
                    onUpdateSettings({
                      userInitials: e.target.value.toUpperCase(),
                    })
                  }
                  className="mt-1 w-full rounded-xl px-3 py-2 text-center text-xs font-bold focus:outline-none"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Curated Themes */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold" style={{ color: theme.textMuted }}>
              Color Palette &amp; Vibe
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
                const t = THEMES[tid];
                const active = settings.themeId === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ themeId: tid, customAccent: undefined })
                    }
                    className="flex items-center justify-between rounded-2xl p-3 text-left transition-all"
                    style={{
                      backgroundColor: active ? theme.accentSoft : theme.surfaceAlt,
                      border: `1.5px solid ${
                        active ? theme.accent : theme.borderColor
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        <span
                          className="h-5 w-5 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: t.railBg }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: t.accent }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-neutral-200 shadow-sm"
                          style={{ backgroundColor: t.canvasBg }}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{t.name}</div>
                        <div
                          className="text-[11px]"
                          style={{ color: theme.textMuted }}
                        >
                          {t.tagline}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <Check
                        className="h-4 w-4 shrink-0"
                        style={{ color: theme.accent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Accent Color Override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold" style={{ color: theme.textMuted }}>
                Accent Color Override
              </h3>
              {settings.customAccent && (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ customAccent: undefined })}
                  className="text-[11px] hover:underline"
                  style={{ color: theme.accent }}
                >
                  Reset to theme
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {ACCENT_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Select accent color ${hex}`}
                  onClick={() => onUpdateSettings({ customAccent: hex })}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                    theme.accent.toLowerCase() === hex.toLowerCase()
                      ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-medium"
                style={{
                  backgroundColor: theme.surfaceAlt,
                  border: `1px solid ${theme.borderColor}`,
                }}
              >
                <span>Custom</span>
                <input
                  type="color"
                  value={theme.accent}
                  onChange={(e) =>
                    onUpdateSettings({ customAccent: e.target.value })
                  }
                  className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                />
              </label>
            </div>
          </div>

          {/* Typography Style */}
          <div className="space-y-2">
            <h3
              className="flex items-center gap-1.5 text-xs font-bold"
              style={{ color: theme.textMuted }}
            >
              <Type className="h-3.5 w-3.5" />
              <span>Typography Style</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'cozy-sans', label: 'Cozy Sans' },
                  { id: 'editorial-serif', label: 'Editorial Serif' },
                  { id: 'stationery-mono', label: 'Typewriter' },
                ] as { id: FontStyleId; label: string }[]
              ).map((f) => {
                const active = settings.fontStyle === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontStyle: f.id })}
                    className="rounded-xl px-2.5 py-2 text-xs font-medium"
                    style={{
                      backgroundColor: active ? theme.accentSoft : theme.surfaceAlt,
                      color: active ? theme.accentText : theme.textPrimary,
                      border: `1px solid ${
                        active ? theme.accent : theme.borderColor
                      }`,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar & Corner Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold" style={{ color: theme.textMuted }}>
                Sidebar Style
              </h3>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    { id: 'tinted', label: 'Pastel Rail' },
                    { id: 'paper', label: 'Minimal Paper' },
                  ] as { id: RailStyle; label: string }[]
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onUpdateSettings({ railStyle: r.id })}
                    className="rounded-xl px-3 py-2 text-xs font-medium text-left"
                    style={{
                      backgroundColor:
                        settings.railStyle === r.id
                          ? theme.accentSoft
                          : theme.surfaceAlt,
                      border: `1px solid ${
                        settings.railStyle === r.id
                          ? theme.accent
                          : theme.borderColor
                      }`,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold" style={{ color: theme.textMuted }}>
                Card Corners
              </h3>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    { id: 'crisp', label: 'Crisp' },
                    { id: 'cozy', label: 'Cozy' },
                    { id: 'soft', label: 'Extra Soft' },
                  ] as { id: RadiusStyle; label: string }[]
                ).map((rad) => (
                  <button
                    key={rad.id}
                    type="button"
                    onClick={() => onUpdateSettings({ radiusStyle: rad.id })}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium text-left"
                    style={{
                      backgroundColor:
                        settings.radiusStyle === rad.id
                          ? theme.accentSoft
                          : theme.surfaceAlt,
                      border: `1px solid ${
                        settings.radiusStyle === rad.id
                          ? theme.accent
                          : theme.borderColor
                      }`,
                    }}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pinned Home Keepsake Stamp */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold" style={{ color: theme.textMuted }}>
              Dashboard Keepsake Stamp
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {ART_GALLERY.filter((a) => a.imageUrl).map((art) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      pinnedStampImage: art.imageUrl!,
                    })
                  }
                  className="h-12 overflow-hidden rounded-xl border-2"
                  style={{
                    borderColor:
                      settings.pinnedStampImage === art.imageUrl
                        ? theme.accent
                        : theme.borderColor,
                  }}
                >
                  <img
                    src={art.imageUrl}
                    alt={art.label}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <input
              type="text"
              value={settings.pinnedStampCaption}
              onChange={(e) =>
                onUpdateSettings({ pinnedStampCaption: e.target.value })
              }
              className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
              style={{
                backgroundColor: theme.surfaceAlt,
                border: `1px solid ${theme.borderColor}`,
              }}
            />
          </div>

          {/* Sticker Drawer for active page */}
          {hasActivePage && onAddStickerToActivePage && (
            <div className="space-y-2">
              <h3
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{ color: theme.textMuted }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Decorate Current Page with Stickers</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {STICKER_PACK.map((stk) => (
                  <button
                    key={stk}
                    type="button"
                    onClick={() => onAddStickerToActivePage(stk)}
                    className="rounded-xl p-2 text-lg transition-transform hover:scale-115"
                    style={{
                      backgroundColor: theme.surfaceAlt,
                      border: `1px solid ${theme.borderColor}`,
                    }}
                  >
                    {stk}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workspace Backup & Reset */}
          <div
            className="pt-4 flex items-center justify-between gap-2"
            style={{ borderTop: `1px solid ${theme.borderColor}` }}
          >
            <button
              type="button"
              onClick={onExportWorkspace}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: theme.surfaceAlt,
                border: `1px solid ${theme.borderColor}`,
              }}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={onResetWorkspace}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
