import React from 'react';
import {
  Home,
  LayoutGrid,
  Palette,
  Plus,
  Sparkles,
  LogOut,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { PlannerPage, ThemeDefinition, WorkspaceSettings } from '../types/planner';

interface LeftRailProps {
  theme: ThemeDefinition;
  settings: WorkspaceSettings;
  accountName: string;
  accountInitials: string;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
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
  onDeleteAccount,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isTinted = settings.railStyle === 'tinted';
  const railBackground = isTinted ? theme.railBg : theme.surfaceAlt;
  const railText = isTinted ? theme.railText : theme.textPrimary;
  const railMuted = isTinted ? 'rgba(255,255,255,0.75)' : theme.textMuted;
  const activeBg = isTinted ? theme.railActiveBg : theme.accentSoft;
  const activeText = isTinted ? theme.railActiveText : theme.accentText;

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await onDeleteAccount();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Your account could not be deleted. Please try again.'
      );
      setDeletingAccount(false);
    }
  };

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
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setDeleteDialogOpen(true);
          }}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete account</span>
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

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className="w-full max-w-md rounded-2xl border border-[#F2DCE5] bg-white p-6 text-[#2A2226] shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-account-title" className="text-lg font-bold">
                  Delete your account?
                </h2>
                <p
                  id="delete-account-description"
                  className="mt-2 text-sm leading-6 text-[#786870]"
                >
                  This permanently deletes your account and all saved planner
                  pages, todos, and settings. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-xl border border-[#EAD9E0] px-4 py-2.5 text-sm font-semibold text-[#51434A] hover:bg-[#FFFBFD] disabled:opacity-50"
              >
                Keep my account
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => void handleDeleteAccount()}
                className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
              >
                {deletingAccount ? 'Deleting account…' : 'Delete my account'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};
