import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Flame,
  GripVertical,
  LayoutTemplate,
  MoreVertical,
  Palette,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  PageCategory,
  PlannerPage,
  QuickTodo,
  ThemeDefinition,
  WorkspaceSettings,
} from '../types/planner';

interface HomeDashboardProps {
  theme: ThemeDefinition;
  settings: WorkspaceSettings;
  pages: PlannerPage[];
  quickTodos: QuickTodo[];
  onOpenPage: (pageId: string) => void;
  onCreatePage: () => void;
  onOpenCustomizer: () => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onToggleQuickTodo: (todoId: string) => void;
  onAddQuickTodo: (text: string, pageId?: string) => void;
  onDeleteQuickTodo: (todoId: string) => void;
  onCheckInStreak: () => void;
}

const CATEGORY_FILTERS: { id: 'all' | PageCategory; label: string }[] = [
  { id: 'all', label: 'All Pages' },
  { id: 'daily', label: 'Daily' },
  { id: 'goals', label: 'Goals' },
  { id: 'habits', label: 'Habits' },
  { id: 'journal', label: 'Journal' },
  { id: 'projects', label: 'Projects' },
];

export function computePageCompletion(page: PlannerPage): {
  done: number;
  total: number;
  percent: number | null;
} {
  let done = 0;
  let total = 0;

  for (const block of page.blocks) {
    if (block.type === 'checklist' && block.items) {
      total += block.items.length;
      done += block.items.filter((item) => item.done).length;
    } else if (block.type === 'visual-grid' && block.visualCards) {
      total += block.visualCards.length;
      done += block.visualCards.filter((card) => card.completed).length;
    } else if (block.type === 'habit-tracker' && block.habits) {
      for (const h of block.habits) {
        total += h.days.length;
        done += h.days.filter(Boolean).length;
      }
    } else if (
      block.type === 'progress-meter' &&
      typeof block.currentValue === 'number' &&
      typeof block.targetValue === 'number' &&
      block.targetValue > 0
    ) {
      total += block.targetValue;
      done += Math.min(block.currentValue, block.targetValue);
    }
  }

  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : null,
  };
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  theme,
  settings,
  pages,
  quickTodos,
  onOpenPage,
  onCreatePage,
  onOpenCustomizer,
  onReorderPages,
  onDuplicatePage,
  onDeletePage,
  onToggleQuickTodo,
  onAddQuickTodo,
  onDeleteQuickTodo,
  onCheckInStreak,
}) => {
  const [filter, setFilter] = useState<'all' | PageCategory>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [todoTab, setTodoTab] = useState<'all' | 'focus' | 'done'>('all');
  const [newTodoText, setNewTodoText] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  const radiusClass =
    settings.radiusStyle === 'crisp'
      ? 'rounded-lg'
      : settings.radiusStyle === 'soft'
        ? 'rounded-3xl'
        : 'rounded-2xl';

  const filteredPages = useMemo(() => {
    if (filter === 'all') return pages;
    return pages.filter((p) => p.category === filter);
  }, [pages, filter]);

  const filteredTodos = useMemo(() => {
    if (todoTab === 'focus') return quickTodos.filter((t) => !t.done);
    if (todoTab === 'done') return quickTodos.filter((t) => t.done);
    return quickTodos;
  }, [quickTodos, todoTab]);

  // Overall progress for concentric ring widget
  const ringMetrics = useMemo(() => {
    const topPages = pages.slice(0, 3);
    const totalTodos = quickTodos.length;
    const doneTodos = quickTodos.filter((t) => t.done).length;
    const overallPct =
      totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0;

    const ringColors = [theme.accent, '#3A7CA5', '#7CA982'];
    const rings = topPages.map((p, idx) => {
      const comp = computePageCompletion(p);
      return {
        id: p.id,
        title: p.title,
        percent: comp.percent ?? 100,
        color: ringColors[idx % ringColors.length],
      };
    });

    return { totalTodos, doneTodos, overallPct, rings };
  }, [pages, quickTodos, theme.accent]);

  const weekLabel = useMemo(() => {
    const base = new Date(2026, 10, 23); // Nov 23, 2026
    base.setDate(base.getDate() + weekOffset * 7);
    const end = new Date(base);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(base)} – ${fmt(end)}`;
  }, [weekOffset]);

  const handleTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTodoText.trim();
    if (!trimmed) return;
    onAddQuickTodo(trimmed);
    setNewTodoText('');
  };

  return (
    <div className="flex flex-1 flex-col xl:flex-row min-h-0 overflow-y-auto">
      {/* Main Center Dashboard Column */}
      <div className="flex-1 px-6 py-6 md:px-9 md:py-7">
        {/* Header Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 pb-5"
          style={{ borderBottom: `1px solid ${theme.borderColor}` }}
        >
          <div>
            <h1
              className="font-display text-3xl font-bold tracking-tight"
              style={{ color: theme.accent }}
            >
              Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              Drag cards to rearrange your space · Click any page to customize blocks &amp; stickers
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              style={{
                backgroundColor: theme.surfaceAlt,
                color: theme.textPrimary,
                border: `1px solid ${theme.borderColor}`,
              }}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Theme &amp; Decor</span>
            </button>
            <button
              type="button"
              onClick={onCreatePage}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform active:scale-[0.98] whitespace-nowrap shrink-0"
              style={{ backgroundColor: theme.accent }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Page</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex flex-wrap items-center gap-1 rounded-xl p-1"
            style={{ backgroundColor: theme.surfaceAlt }}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const active = filter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilter(cat.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: active ? theme.surfaceBg : 'transparent',
                    color: active ? theme.textPrimary : theme.textMuted,
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <span
            className="text-xs font-tabular"
            style={{ color: theme.textMuted }}
          >
            Showing {filteredPages.length} of {pages.length} pages
          </span>
        </div>

        {/* 3-Column Goal & Planner Cards Grid */}
        {filteredPages.length === 0 ? (
          <div
            className={`mt-6 flex flex-col items-center justify-center p-12 text-center ${radiusClass}`}
            style={{
              backgroundColor: theme.surfaceAlt,
              border: `1px dashed ${theme.borderColor}`,
            }}
          >
            <LayoutTemplate
              className="h-8 w-8 mb-3"
              style={{ color: theme.accent }}
            />
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
              No pages in this category yet
            </p>
            <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
              Create a custom page with checklists, habit grids, or stickers.
            </p>
            <button
              type="button"
              onClick={onCreatePage}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: theme.accent }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Page</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPages.map((page) => {
              const realIndex = pages.findIndex((p) => p.id === page.id);
              const completion = computePageCompletion(page);
              const isDragging = draggedIndex === realIndex;
              const isDropTarget =
                dragOverIndex === realIndex && draggedIndex !== realIndex;

              return (
                <div
                  key={page.id}
                  draggable={filter === 'all'}
                  onDragStart={() => setDraggedIndex(realIndex)}
                  onDragOver={(e) => {
                    if (filter !== 'all') return;
                    e.preventDefault();
                    setDragOverIndex(realIndex);
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === realIndex) setDragOverIndex(null);
                  }}
                  onDrop={() => {
                    if (
                      filter === 'all' &&
                      draggedIndex !== null &&
                      draggedIndex !== realIndex
                    ) {
                      onReorderPages(draggedIndex, realIndex);
                    }
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`group relative flex flex-col overflow-hidden transition-all duration-150 ${radiusClass} ${
                    isDragging ? 'opacity-50 scale-[0.98]' : 'hover:-translate-y-0.5'
                  }`}
                  style={{
                    backgroundColor: theme.surfaceBg,
                    border: isDropTarget
                      ? `2px solid ${theme.accent}`
                      : `1px solid ${theme.borderColor}`,
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Illustrated Card Cover */}
                  <div
                    onClick={() => onOpenPage(page.id)}
                    className="relative h-36 w-full cursor-pointer overflow-hidden"
                    style={{
                      background:
                        page.coverGradient ||
                        'linear-gradient(135deg, #FCE7F0 0%, #E7F0FA 100%)',
                    }}
                  >
                    {page.coverImage ? (
                      <img
                        src={page.coverImage}
                        alt={page.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">
                        {page.icon}
                      </div>
                    )}

                    {/* Top-left Completion % (Image 1 inspired) */}
                    <div
                      className="absolute left-3 top-3 rounded-lg px-2 py-0.5 text-xs font-semibold font-tabular backdrop-blur-sm"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.88)',
                        color: theme.accent,
                      }}
                    >
                      {completion.percent !== null ? `${completion.percent}%` : '--%'}
                    </div>

                    {/* Drag Grip indicator on hover */}
                    {filter === 'all' && (
                      <div
                        title="Drag to reorder"
                        className="absolute left-1/2 top-2.5 -translate-x-1/2 rounded-md bg-white/80 px-1.5 py-0.5 text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100 cursor-grab"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* Top-right Quick Menu Button */}
                    <button
                      type="button"
                      aria-label={`Options for ${page.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === page.id ? null : page.id);
                      }}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm transition-colors hover:bg-white"
                      style={{ border: `1px solid ${theme.borderColor}` }}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {/* Dropdown menu */}
                    {openMenuId === page.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-3 top-11 z-20 w-40 rounded-xl py-1.5 shadow-lg"
                        style={{
                          backgroundColor: theme.surfaceBg,
                          border: `1px solid ${theme.borderColor}`,
                          color: theme.textPrimary,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onOpenPage(page.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-black/5"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Open &amp; Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDuplicatePage(page.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-black/5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Duplicate Page</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDeletePage(page.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Page</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div
                    onClick={() => onOpenPage(page.id)}
                    className="flex flex-1 cursor-pointer flex-col justify-between p-4"
                  >
                    <div>
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-snug shrink-0">
                          {page.icon}
                        </span>
                        <h3
                          className="line-clamp-1 text-sm font-bold leading-snug"
                          style={{ color: theme.accent }}
                        >
                          {page.title}
                        </h3>
                      </div>

                      <p
                        className="mt-1 truncate text-xs"
                        style={{ color: theme.textMuted }}
                      >
                        {page.subtitle}
                      </p>

                      {/* Clean unboxed icon summary strip */}
                      <div
                        className="mt-3 flex items-center gap-4 text-xs font-tabular"
                        style={{ color: theme.textMuted }}
                      >
                        <span className="inline-flex items-center gap-1" title="Modular blocks">
                          <LayoutTemplate className="h-3.5 w-3.5" />
                          {page.blocks.length}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Completed items">
                          <CheckSquare className="h-3.5 w-3.5" />
                          {completion.total > 0
                            ? `${completion.done}/${completion.total}`
                            : '0/0'}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Stickers">
                          <span>{page.stickers.slice(0, 2).join(' ')}</span>
                        </span>
                      </div>
                    </div>

                    <div
                      className="mt-4 flex items-center justify-between pt-3 text-xs"
                      style={{
                        borderTop: `1px solid ${theme.borderColor}`,
                        color: theme.textMuted,
                      }}
                    >
                      <span className="font-medium" style={{ color: theme.textPrimary }}>
                        {page.dueLabel}
                      </span>
                      <span>{page.updatedAt}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Productivity & Rings Sidebar (Image 1 inspired) */}
      <aside
        className="w-full xl:w-[340px] shrink-0 px-6 py-6 flex flex-col gap-5"
        style={{
          borderLeft: `1px solid ${theme.borderColor}`,
          backgroundColor: theme.isDark ? theme.surfaceBg : theme.canvasBg,
        }}
      >
        {/* Streak Card */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
              Streak
            </h2>
            <button
              type="button"
              onClick={onCheckInStreak}
              className="text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ color: theme.accent }}
            >
              + Check in today
            </button>
          </div>

          <div
            className={`flex items-center gap-3.5 p-3.5 ${radiusClass}`}
            style={{
              backgroundColor: theme.surfaceBg,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
            >
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div
                className="text-sm font-bold font-tabular"
                style={{ color: theme.accent }}
              >
                {settings.streakDays} days
              </div>
              <div className="text-xs" style={{ color: theme.textMuted }}>
                without missing a task
              </div>
            </div>
          </div>
        </div>

        {/* To-Do List + Concentric Multi-Ring Donut Chart */}
        <div
          className={`flex flex-col p-4 ${radiusClass}`}
          style={{
            backgroundColor: theme.surfaceBg,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>
              To-Do List
            </h2>
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: theme.textMuted }}
            >
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="rounded p-1 hover:bg-black/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-tabular whitespace-nowrap">{weekLabel}</span>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="rounded p-1 hover:bg-black/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Concentric Multi-Ring SVG Donut */}
          <div className="my-4 flex flex-col items-center">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
                {ringMetrics.rings.map((ring, idx) => {
                  const r = 74 - idx * 14;
                  const c = 2 * Math.PI * r;
                  const offset = c - (ring.percent / 100) * c;
                  return (
                    <g key={ring.id}>
                      <circle
                        cx="90"
                        cy="90"
                        r={r}
                        fill="none"
                        stroke={theme.surfaceAlt}
                        strokeWidth="10"
                      />
                      <circle
                        cx="90"
                        cy="90"
                        r={r}
                        fill="none"
                        stroke={ring.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        className="transition-all duration-300"
                      />
                    </g>
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  className="text-2xl font-bold font-tabular leading-none"
                  style={{ color: theme.textPrimary }}
                >
                  {ringMetrics.overallPct}%
                </span>
                <span
                  className="mt-1 text-xs font-medium font-tabular"
                  style={{ color: theme.textMuted }}
                >
                  {ringMetrics.doneTodos}/{ringMetrics.totalTodos}
                </span>
              </div>
            </div>

            {/* Clean unboxed legend */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {ringMetrics.rings.map((ring) => (
                <button
                  key={ring.id}
                  type="button"
                  onClick={() => onOpenPage(ring.id)}
                  className="inline-flex items-center gap-1.5 text-[11px] hover:underline"
                  style={{ color: theme.textMuted }}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: ring.color }}
                  />
                  <span className="max-w-[92px] truncate">{ring.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter tabs */}
          <div
            className="grid grid-cols-3 gap-1 rounded-xl p-1"
            style={{ backgroundColor: theme.surfaceAlt }}
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'focus', label: 'Focus' },
                { id: 'done', label: 'Done' },
              ] as const
            ).map((tab) => {
              const active = todoTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTodoTab(tab.id)}
                  className="rounded-lg py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? theme.surfaceBg : 'transparent',
                    color: active ? theme.accent : theme.textMuted,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Quick Tasks List */}
          <div className="mt-3 flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
            {filteredTodos.length === 0 ? (
              <p
                className="py-4 text-center text-xs"
                style={{ color: theme.textMuted }}
              >
                No tasks in this view yet.
              </p>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/[0.03]"
                >
                  <button
                    type="button"
                    onClick={() => onToggleQuickTodo(todo.id)}
                    className="flex flex-1 items-start gap-2.5 text-left min-w-0"
                  >
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                      style={{
                        backgroundColor: todo.done ? theme.accent : 'transparent',
                        borderColor: todo.done ? theme.accent : theme.borderColor,
                        color: '#FFFFFF',
                      }}
                    >
                      {todo.done && <Check className="h-3 w-3 stroke-[2.5]" />}
                    </span>
                    <span
                      className={`text-xs leading-snug break-words ${
                        todo.done ? 'line-through opacity-60' : ''
                      }`}
                      style={{ color: theme.textPrimary }}
                    >
                      {todo.text}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Remove task"
                    onClick={() => onDeleteQuickTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-neutral-400 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Inline Add Task */}
          <form onSubmit={handleTodoSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a quick task..."
              className="flex-1 min-w-0 rounded-xl px-3 py-2 text-xs focus:outline-none"
              style={{
                backgroundColor: theme.surfaceAlt,
                color: theme.textPrimary,
                border: `1px solid ${theme.borderColor}`,
              }}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-white shrink-0 transition-transform active:scale-[0.98]"
              style={{ backgroundColor: theme.accent }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Pinned Stamp & Note Keepsake (Bridging Image 1 & Image 2) */}
        <div
          className={`flex items-center gap-3.5 p-3.5 ${radiusClass}`}
          style={{
            backgroundColor: theme.surfaceAlt,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm">
            <img
              src={settings.pinnedStampImage}
              alt="Pinned keepsake stamp"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold inline-flex items-center gap-1"
                style={{ color: theme.textPrimary }}
              >
                <Calendar className="h-3 w-3" style={{ color: theme.accent }} />
                Daily Keepsake
              </span>
              <button
                type="button"
                onClick={onOpenCustomizer}
                className="text-[11px] font-medium hover:underline"
                style={{ color: theme.accent }}
              >
                Swap
              </button>
            </div>
            <p
              className="mt-1 line-clamp-2 text-[11px] leading-relaxed"
              style={{ color: theme.textMuted }}
            >
              {settings.pinnedStampCaption}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};
