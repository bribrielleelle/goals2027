import React from 'react';
import {
  Home,
  LayoutGrid,
  Palette,
  Plus,
  Sparkles,
  LogOut,
  X,
} from 'lucide-react';
import { PlannerPage, ThemeDefinition, WorkspaceSettings } from '../types/planner';

interface LeftRailProps {
  theme: ThemeDefinition;
  settings: WorkspaceSettings;
  accountName: string;
  accountInitials: string;
  onSignOut: () => void;
  pages: PlannerPage[];
  activeView: 'home' | 'page';
  activePageId: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectHome: () => void;
  onSelectPage: (pageId: string) => void;
  onOpenNewPage: () => void;
  onOpenCustomizer: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  theme,
  settings,
  accountName,
  accountInitials,
  onSignOut,
  pages,
  activeView,
  activePageId,
  mobileOpen,
  onCloseMobile,
  onSelectHome,
  onSelectPage,
  onOpenNewPage,
  onOpenCustomizer,
}) => {
  const isTinted = settings.railStyle === 'tinted';
  const railBackground = isTinted ? theme.railBg : theme.surfaceAlt;
  const railText = isTinted ? theme.railText : theme.textPrimary;
  const railMuted = isTinted ? 'rgba(255,255,255,0.75)' : theme.textMuted;
  const activeBg = isTinted ? theme.railActiveBg : theme.accentSoft;
  const activeText = isTinted ? theme.railActiveText : theme.accentText;

  const railContent = (
    <aside
      className="flex h-full w-[228px] shrink-0 flex-col justify-between px-3.5 py-5 transition-colors duration-200 select-none"
      style={{
        backgroundColor: railBackground,
        color: railText,
        borderRight: isTinted ? 'none' : `1px solid ${theme.borderColor}`,
      }}
    >
      <div className="flex flex-col gap-5 overflow-y-auto pr-0.5">
        {/* Workspace Identity & Avatar */}
        <div className="flex items-center justify-between px-1.5">
          <button
            type="button"
            onClick={onSelectHome}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-wide shadow-sm"
              style={{
                backgroundColor: isTinted ? 'rgba(255,255,255,0.92)' : theme.accent,
                color: isTinted ? theme.accent : '#FFFFFF',
              }}
            >
              {settings.userInitials || accountInitials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">
                {settings.workspaceName}
              </div>
              <div
                className="truncate text-[11px]"
                style={{ color: railMuted }}
              >
                {settings.userName || accountName}&apos;s space
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="rounded-md p-1.5 lg:hidden hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Core Navigation */}
        <nav className="flex flex-col gap-1" aria-label="Workspace navigation">
          <button
            type="button"
            onClick={() => {
              onSelectHome();
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            style={{
              backgroundColor: activeView === 'home' ? activeBg : 'transparent',
              color: activeView === 'home' ? activeText : railText,
            }}
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenCustomizer();
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
            style={{ color: railText }}
          >
            <Palette className="h-4 w-4 shrink-0" />
            <span>Customize Studio</span>
          </button>
        </nav>

        {/* Custom Pages List */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-3 pt-1">
            <span
              className="text-[11px] font-semibold tracking-wide"
              style={{ color: railMuted }}
            >
              My Pages
            </span>
            <button
              type="button"
              onClick={() => {
                onOpenNewPage();
                onCloseMobile();
              }}
              aria-label="Create new page"
              className="rounded-md p-1 transition-colors hover:bg-white/15"
              style={{ color: railText }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {pages.map((page) => {
              const isActive = activeView === 'page' && activePageId === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    onSelectPage(page.id);
                    onCloseMobile();
                  }}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? activeBg : 'transparent',
                    color: isActive ? activeText : railText,
                  }}
                >
                  <span className="shrink-0 text-sm leading-none">{page.icon}</span>
                  <span className="truncate flex-1">{page.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Primary Action */}
      <div className="pt-4">
        <button
          type="button"
          onClick={() => {
            onOpenNewPage();
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-transform active:scale-[0.98] whitespace-nowrap"
          style={{
            backgroundColor: isTinted ? 'rgba(255,255,255,0.94)' : theme.accent,
            color: isTinted ? theme.accent : '#FFFFFF',
          }}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>New Custom Page</span>
        </button>

        <div
          className="mt-3 flex items-center justify-center gap-1.5 text-[11px]"
          style={{ color: railMuted }}
        >
          <LayoutGrid className="h-3 w-3" />
          <span className="font-tabular">{pages.length} custom pages</span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5"
          style={{ color: railText }}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop persistent rail */}
      <div className="hidden lg:block h-full shrink-0">{railContent}</div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{railContent}</div>
        </div>
      )}
    </>
  );
};
