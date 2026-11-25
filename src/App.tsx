import { useEffect, useMemo, useState } from 'react';
import { Menu, Palette, Plus } from 'lucide-react';
import { CreatePageModal } from './components/CreatePageModal';
import { CustomizerDrawer } from './components/CustomizerDrawer';
import { HomeDashboard } from './components/HomeDashboard';
import { LeftRail } from './components/LeftRail';
import { PageWorkspace } from './components/PageWorkspace';
import {
  DEFAULT_SETTINGS,
  INITIAL_PAGES,
  INITIAL_QUICK_TODOS,
  THEMES,
} from './data/presets';
import {
  createEmptyWorkspace,
  type PlannerWorkspace,
} from './data/workspaceDefaults';
import { loadWorkspace, saveWorkspace } from './lib/workspaceApi';
import {
  PlannerPage,
  QuickTodo,
  ThemeDefinition,
  WorkspaceSettings,
} from './types/planner';

interface PlannerWorkspaceAppProps {
  userId: string;
  accountName: string;
  accountInitials: string;
  onSignOut: () => void;
}

export function PlannerWorkspaceApp({
  userId,
  accountName,
  accountInitials,
  onSignOut,
}: PlannerWorkspaceAppProps) {
  const [pages, setPages] = useState<PlannerPage[]>([]);
  const [quickTodos, setQuickTodos] = useState<QuickTodo[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>(
    () => createEmptyWorkspace().settings
  );
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>(
    'saved'
  );

  const [activeView, setActiveView] = useState<'home' | 'page'>('home');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // Loading always starts from a blank in-memory state. Anonymous browser data
  // is left untouched and is never attached to a signed-in account.
  useEffect(() => {
    const controller = new AbortController();
    setWorkspaceLoaded(false);
    setWorkspaceLoadError(null);
    setPages([]);
    setQuickTodos([]);
    setSettings(createEmptyWorkspace().settings);
    setActiveView('home');
    setActivePageId(null);

    loadWorkspace(controller.signal)
      .then((workspace) => {
        if (controller.signal.aborted) return;
        setPages(workspace.pages);
        setQuickTodos(workspace.quickTodos);
        setSettings(workspace.settings);
        setActivePageId(workspace.pages[0]?.id ?? null);
        setWorkspaceLoaded(true);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setWorkspaceLoadError(
          error instanceof Error
            ? error.message
            : 'Your workspace could not be loaded.'
        );
      });

    return () => controller.abort();
  }, [userId, loadAttempt]);

  // Debounce saves so text edits and drag operations do not flood the API.
  useEffect(() => {
    if (!workspaceLoaded) return;
    let cancelled = false;
    const workspace: PlannerWorkspace = { pages, quickTodos, settings };
    const timeout = window.setTimeout(() => {
      setSaveStatus('saving');
      saveWorkspace(workspace)
        .then(() => {
          if (!cancelled) setSaveStatus('saved');
        })
        .catch(() => {
          if (!cancelled) setSaveStatus('error');
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [workspaceLoaded, pages, quickTodos, settings, saveAttempt]);

  // Resolve active theme with optional custom accent override
  const activeTheme: ThemeDefinition = useMemo(() => {
    const base = THEMES[settings.themeId] ?? THEMES['strawberry-milk'];
    if (!settings.customAccent) return base;
    return {
      ...base,
      accent: settings.customAccent,
      railBg: base.isDark ? base.railBg : settings.customAccent,
    };
  }, [settings.themeId, settings.customAccent]);

  // Apply .dark class and font CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (settings.fontStyle === 'editorial-serif') {
      root.style.setProperty('--active-display-font', 'var(--font-serif)');
      root.style.setProperty('--active-font', 'var(--font-sans)');
    } else if (settings.fontStyle === 'stationery-mono') {
      root.style.setProperty('--active-display-font', 'var(--font-mono)');
      root.style.setProperty('--active-font', 'var(--font-mono)');
    } else {
      root.style.setProperty('--active-display-font', 'var(--font-sans)');
      root.style.setProperty('--active-font', 'var(--font-sans)');
    }
  }, [activeTheme.isDark, settings.fontStyle]);

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) ?? null,
    [pages, activePageId]
  );

  if (workspaceLoadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fff9fb] px-6 text-center text-[#2A2226]">
        <img src="/logo.svg" alt="" className="h-12 w-12 rounded-2xl" />
        <h1 className="text-xl font-bold">We couldn&apos;t open your workspace</h1>
        <p className="max-w-sm text-sm text-[#786870]">{workspaceLoadError}</p>
        <button
          type="button"
          onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          className="rounded-xl bg-[#DB4F88] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!workspaceLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff9fb] text-sm text-[#786870]">
        Opening your workspace…
      </main>
    );
  }

  const handleOpenPage = (pageId: string) => {
    setActivePageId(pageId);
    setActiveView('page');
  };

  const handleReorderPages = (fromIdx: number, toIdx: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const handleDuplicatePage = (pageId: string) => {
    const src = pages.find((p) => p.id === pageId);
    if (!src) return;
    const copy: PlannerPage = {
      ...src,
      id: `page-${Date.now()}`,
      title: `${src.title} (Copy)`,
      updatedAt: 'Just now',
    };
    setPages((prev) => [copy, ...prev]);
    showToast(`Duplicated "${src.title}"`);
  };

  const handleDeletePage = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    if (activePageId === pageId) {
      setActiveView('home');
      setActivePageId(null);
    }
    showToast('Page deleted');
  };

  const handleUpdatePage = (updated: PlannerPage) => {
    setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleCreatePage = (newPage: PlannerPage) => {
    setPages((prev) => [newPage, ...prev]);
    setCreateModalOpen(false);
    setActivePageId(newPage.id);
    setActiveView('page');
    showToast(`Created "${newPage.title}"`);
  };

  const handleToggleQuickTodo = (todoId: string) => {
    setQuickTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, done: !t.done, bucket: !t.done ? 'done' : 'focus' }
          : t
      )
    );
  };

  const handleAddQuickTodo = (text: string, pageId?: string) => {
    setQuickTodos((prev) => [
      {
        id: `qt-${Date.now()}`,
        text,
        done: false,
        pageId,
        bucket: 'focus',
      },
      ...prev,
    ]);
  };

  const handleDeleteQuickTodo = (todoId: string) => {
    setQuickTodos((prev) => prev.filter((t) => t.id !== todoId));
  };

  const handleCheckInStreak = () => {
    setSettings((prev) => ({
      ...prev,
      streakDays: prev.streakDays + 1,
      lastCheckInDate: new Date().toISOString().slice(0, 10),
    }));
    showToast('Daily check-in logged! Streak +1');
  };

  const handleExportWorkspace = () => {
    const data = JSON.stringify({ pages, quickTodos, settings }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'komorebi-planner-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported workspace JSON');
  };

  const handleResetWorkspace = () => {
    setPages(INITIAL_PAGES);
    setQuickTodos(INITIAL_QUICK_TODOS);
    setSettings(DEFAULT_SETTINGS);
    setActiveView('home');
    setActivePageId(INITIAL_PAGES[0].id);
    setCustomizerOpen(false);
    showToast('Workspace restored to starter template');
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.canvasBg,
        color: activeTheme.textPrimary,
      }}
    >
      {/* Left Navigation Rail (Image 1 inspired) */}
      <LeftRail
        theme={activeTheme}
        settings={settings}
        accountName={accountName}
        accountInitials={accountInitials}
        onSignOut={onSignOut}
        pages={pages}
        activeView={activeView}
        activePageId={activePageId}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onSelectHome={() => setActiveView('home')}
        onSelectPage={handleOpenPage}
        onOpenNewPage={() => setCreateModalOpen(true)}
        onOpenCustomizer={() => setCustomizerOpen(true)}
      />

      {/* Main Right Workspace Column */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Compact Mobile Top Bar (<= 15% viewport height) */}
        <header
          className="flex lg:hidden items-center justify-between gap-4 px-4 py-3 shrink-0"
          style={{
            backgroundColor: activeTheme.surfaceBg,
            borderBottom: `1px solid ${activeTheme.borderColor}`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5"
              style={{ backgroundColor: activeTheme.surfaceAlt }}
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="font-display truncate text-sm font-bold whitespace-nowrap">
              {settings.workspaceName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCustomizerOpen(true)}
              aria-label="Customize workspace"
              className="rounded-lg p-2"
              style={{ backgroundColor: activeTheme.surfaceAlt }}
            >
              <Palette className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
              style={{ backgroundColor: activeTheme.accent }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Page</span>
            </button>
          </div>
        </header>

        {/* Active View: Home Dashboard vs. Custom Goal Page */}
        {activeView === 'home' || !activePage ? (
          <HomeDashboard
            theme={activeTheme}
            settings={settings}
            pages={pages}
            quickTodos={quickTodos}
            onOpenPage={handleOpenPage}
            onCreatePage={() => setCreateModalOpen(true)}
            onOpenCustomizer={() => setCustomizerOpen(true)}
            onReorderPages={handleReorderPages}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            onToggleQuickTodo={handleToggleQuickTodo}
            onAddQuickTodo={handleAddQuickTodo}
            onDeleteQuickTodo={handleDeleteQuickTodo}
            onCheckInStreak={handleCheckInStreak}
          />
        ) : (
          <PageWorkspace
            page={activePage}
            theme={activeTheme}
            settings={settings}
            onBackHome={() => setActiveView('home')}
            onUpdatePage={handleUpdatePage}
            onOpenCustomizer={() => setCustomizerOpen(true)}
          />
        )}
      </div>

      {/* Create New Page Modal */}
      {createModalOpen && (
        <CreatePageModal
          theme={activeTheme}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreatePage}
        />
      )}

      {/* Workspace Customizer Studio Drawer */}
      <CustomizerDrawer
        open={customizerOpen}
        theme={activeTheme}
        settings={settings}
        hasActivePage={activeView === 'page' && Boolean(activePage)}
        onClose={() => setCustomizerOpen(false)}
        onUpdateSettings={(patch) =>
          setSettings((prev) => ({ ...prev, ...patch }))
        }
        onAddStickerToActivePage={(stk) => {
          if (!activePage) return;
          handleUpdatePage({
            ...activePage,
            stickers: [...activePage.stickers, stk],
          });
        }}
        onExportWorkspace={handleExportWorkspace}
        onResetWorkspace={handleResetWorkspace}
      />

      {/* Quiet Toast Feedback */}
      {toastMsg && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
          style={{ backgroundColor: activeTheme.accent }}
        >
          {toastMsg}
        </div>
      )}

      <div
        className={`fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border px-3 py-1.5 text-[11px] shadow-sm ${
          saveStatus === 'error'
            ? 'border-rose-200 bg-white text-rose-700'
            : 'border-[#F2DCE5] bg-white/95 text-[#786870]'
        }`}
        role="status"
        aria-live="polite"
      >
        {saveStatus === 'saving' && 'Saving to your account…'}
        {saveStatus === 'saved' && 'Saved to your account'}
        {saveStatus === 'error' && (
          <button
            type="button"
            onClick={() => setSaveAttempt((attempt) => attempt + 1)}
            className="font-semibold underline underline-offset-2"
          >
            Couldn&apos;t save. Retry
          </button>
        )}
      </div>
    </div>
  );
}
