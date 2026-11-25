import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Columns2,
  Grid2x2,
  Image as ImageIcon,
  LayoutList,
  Palette,
  Plus,
  Smile,
  Sparkles,
  Sticker,
  Table2,
  Target,
  Timer,
  Upload,
} from 'lucide-react';
import { ART_GALLERY, STICKER_PACK } from '../data/presets';
import {
  BlockColumn,
  BlockType,
  PageBlock,
  PageLayout,
  PlannerPage,
  ThemeDefinition,
  WorkspaceSettings,
} from '../types/planner';
import { BlockRenderer } from './BlockRenderer';

interface PageWorkspaceProps {
  page: PlannerPage;
  theme: ThemeDefinition;
  settings: WorkspaceSettings;
  onBackHome: () => void;
  onUpdatePage: (updated: PlannerPage) => void;
  onOpenCustomizer: () => void;
}

const BLOCK_CATALOG: {
  type: BlockType;
  label: string;
  desc: string;
  defaultCol: BlockColumn;
  icon: React.ReactNode;
}[] = [
  {
    type: 'checklist',
    label: 'Highlighted Checklist',
    desc: 'Color-banded to-do or reading list',
    defaultCol: 'left',
    icon: <LayoutList className="h-4 w-4" />,
  },
  {
    type: 'flip-clock',
    label: 'Pastel Flip Clock',
    desc: 'Live split-flap studio clock',
    defaultCol: 'left',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    type: 'visual-grid',
    label: 'Illustrated Cards Grid',
    desc: 'Monthly or milestone visual tiles',
    defaultCol: 'right',
    icon: <Grid2x2 className="h-4 w-4" />,
  },
  {
    type: 'goal-table',
    label: 'Structured Tracker Table',
    desc: 'Categorized goals, notes & targets',
    defaultCol: 'right',
    icon: <Table2 className="h-4 w-4" />,
  },
  {
    type: 'habit-tracker',
    label: '7-Day Habit Matrix',
    desc: 'Check off daily habits Mon–Sun',
    defaultCol: 'right',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    type: 'brain-dump',
    label: 'Cozy Brain Dump Note',
    desc: 'Freeform tinted note pad',
    defaultCol: 'right',
    icon: <Smile className="h-4 w-4" />,
  },
  {
    type: 'stamp-sticker',
    label: 'Postage Stamp & Note',
    desc: 'Framed keepsake art + caption',
    defaultCol: 'left',
    icon: <Sticker className="h-4 w-4" />,
  },
  {
    type: 'progress-meter',
    label: 'Goal Progress Ring',
    desc: 'Track numeric targets with +/-',
    defaultCol: 'left',
    icon: <Target className="h-4 w-4" />,
  },
  {
    type: 'focus-timer',
    label: 'Focus Pomodoro Timer',
    desc: '15m / 25m / 45m calm work timer',
    defaultCol: 'left',
    icon: <Timer className="h-4 w-4" />,
  },
];

export function createDefaultBlock(type: BlockType, column: BlockColumn): PageBlock {
  const id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'checklist':
      return {
        id,
        type,
        column,
        title: 'New Checklist',
        highlightColor: 'butter',
        items: [
          { id: `${id}-1`, text: 'First item to accomplish', done: false },
          { id: `${id}-2`, text: 'Second item', done: false },
        ],
      };
    case 'flip-clock':
      return {
        id,
        type,
        column,
        title: 'Studio Clock',
        clockFormat: '12h',
        clockTint: 'blush',
      };
    case 'stamp-sticker':
      return {
        id,
        type,
        column,
        title: 'Postage Keepsake',
        stampImage: ART_GALLERY[4].imageUrl,
        stampCaption: 'A gentle reminder for this page.',
      };
    case 'visual-grid':
      return {
        id,
        type,
        column,
        title: 'Visual Milestones',
        visualCards: [
          {
            id: `${id}-c1`,
            label: 'Phase 1',
            note: 'Click to edit milestone reflection...',
            imageUrl: ART_GALLERY[1].imageUrl,
            completed: false,
          },
          {
            id: `${id}-c2`,
            label: 'Phase 2',
            note: 'Click to edit milestone reflection...',
            imageUrl: ART_GALLERY[2].imageUrl,
            completed: false,
          },
          {
            id: `${id}-c3`,
            label: 'Phase 3',
            note: 'Click to edit milestone reflection...',
            imageUrl: ART_GALLERY[3].imageUrl,
            completed: false,
          },
          {
            id: `${id}-c4`,
            label: 'Phase 4',
            note: 'Click to edit milestone reflection...',
            gradient: ART_GALLERY[5].gradient,
            completed: false,
          },
        ],
      };
    case 'goal-table':
      return {
        id,
        type,
        column,
        title: 'Goals & Reflections Log',
        tableColumns: ['Category', 'Subject', 'Notes', 'Target'],
        tableRows: [
          {
            id: `${id}-r1`,
            category: 'focus',
            categoryTint: 'blush',
            subject: 'First milestone',
            notes: 'Add context, links, or reflections here.',
            target: 'This week',
          },
        ],
      };
    case 'habit-tracker':
      return {
        id,
        type,
        column,
        title: 'Weekly Habit Tracker',
        habits: [
          {
            id: `${id}-h1`,
            name: 'Daily mindfulness (10m)',
            days: [true, true, false, false, false, false, false],
          },
        ],
      };
    case 'brain-dump':
      return {
        id,
        type,
        column,
        title: 'Brain Dump',
        noteTint: 'sage',
        noteContent: 'Drop any unpolished thoughts, ideas, or inspirations here...',
      };
    case 'progress-meter':
      return {
        id,
        type,
        column,
        title: 'Target Counter',
        currentValue: 2,
        targetValue: 10,
        unitLabel: 'steps',
      };
    case 'focus-timer':
      return {
        id,
        type,
        column,
        title: 'Focus Session',
        focusMinutes: 25,
      };
  }
}

export const PageWorkspace: React.FC<PageWorkspaceProps> = ({
  page,
  theme,
  settings,
  onBackHome,
  onUpdatePage,
  onOpenCustomizer,
}) => {
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [dragBlockId, setDragBlockId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<BlockColumn | null>(null);

  const radiusClass =
    settings.radiusStyle === 'crisp'
      ? 'rounded-lg'
      : settings.radiusStyle === 'soft'
        ? 'rounded-3xl'
        : 'rounded-2xl';

  const handleUpdateBlock = (updatedBlock: PageBlock) => {
    onUpdatePage({
      ...page,
      updatedAt: 'Just now',
      blocks: page.blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    onUpdatePage({
      ...page,
      updatedAt: 'Just now',
      blocks: page.blocks.filter((b) => b.id !== blockId),
    });
  };

  const handleMoveBlockOrder = (blockId: string, direction: 'up' | 'down') => {
    const target = page.blocks.find((b) => b.id === blockId);
    if (!target) return;
    const sameColIndices = page.blocks
      .map((b, idx) => (b.column === target.column ? idx : -1))
      .filter((idx) => idx !== -1);
    const posInCol = sameColIndices.indexOf(
      page.blocks.findIndex((b) => b.id === blockId)
    );
    const swapPos = direction === 'up' ? posInCol - 1 : posInCol + 1;
    if (swapPos < 0 || swapPos >= sameColIndices.length) return;

    const a = sameColIndices[posInCol];
    const b = sameColIndices[swapPos];
    const next = [...page.blocks];
    [next[a], next[b]] = [next[b], next[a]];
    onUpdatePage({ ...page, updatedAt: 'Just now', blocks: next });
  };

  const handleMoveBlockColumn = (blockId: string, col: BlockColumn) => {
    onUpdatePage({
      ...page,
      updatedAt: 'Just now',
      blocks: page.blocks.map((b) =>
        b.id === blockId ? { ...b, column: col } : b
      ),
    });
  };

  const handleDropOnColumn = (targetCol: BlockColumn) => {
    if (!dragBlockId) return;
    onUpdatePage({
      ...page,
      updatedAt: 'Just now',
      blocks: page.blocks.map((b) =>
        b.id === dragBlockId ? { ...b, column: targetCol } : b
      ),
    });
    setDragBlockId(null);
    setDragOverCol(null);
  };

  const handleDropOnBlock = (targetBlockId: string) => {
    if (!dragBlockId || dragBlockId === targetBlockId) return;
    const targetBlock = page.blocks.find((b) => b.id === targetBlockId);
    const draggedBlock = page.blocks.find((b) => b.id === dragBlockId);
    if (!targetBlock || !draggedBlock) return;

    const withoutDragged = page.blocks.filter((b) => b.id !== dragBlockId);
    const targetIdx = withoutDragged.findIndex((b) => b.id === targetBlockId);
    const updatedDragged: PageBlock = {
      ...draggedBlock,
      column: targetBlock.column,
    };
    withoutDragged.splice(targetIdx, 0, updatedDragged);

    onUpdatePage({
      ...page,
      updatedAt: 'Just now',
      blocks: withoutDragged,
    });
    setDragBlockId(null);
    setDragOverCol(null);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdatePage({
          ...page,
          bannerImage: reader.result,
          coverImage: reader.result,
        });
        setShowBannerPicker(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fullBlocks = page.blocks.filter((b) => b.column === 'full');
  const leftBlocks = page.blocks.filter((b) => b.column === 'left');
  const rightBlocks = page.blocks.filter((b) => b.column === 'right');

  const renderBlockList = (list: PageBlock[], col: BlockColumn, emptyHint: string) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverCol(col);
      }}
      onDragLeave={() => {
        if (dragOverCol === col) setDragOverCol(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        handleDropOnColumn(col);
      }}
      className={`flex flex-col gap-4 rounded-2xl transition-colors ${
        dragOverCol === col ? 'ring-2 ring-offset-2' : ''
      }`}
      style={{
        ['--tw-ring-color' as string]: theme.accent,
      }}
    >
      {list.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl p-6 text-center text-xs"
          style={{
            border: `1px dashed ${theme.borderColor}`,
            color: theme.textMuted,
          }}
        >
          <span>{emptyHint}</span>
        </div>
      ) : (
        list.map((blk) => (
          <BlockRenderer
            key={blk.id}
            block={blk}
            theme={theme}
            radiusClass={radiusClass}
            onUpdate={handleUpdateBlock}
            onDelete={() => handleDeleteBlock(blk.id)}
            onMoveOrder={(dir) => handleMoveBlockOrder(blk.id, dir)}
            onMoveColumn={(nextCol) => handleMoveBlockColumn(blk.id, nextCol)}
            onDragStart={() => setDragBlockId(blk.id)}
            onDragEnd={() => {
              setDragBlockId(null);
              setDragOverCol(null);
            }}
            onDropOnBlock={() => handleDropOnBlock(blk.id)}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top Panoramic Illustrated Banner (Image 2 inspired!) */}
      <div
        className="group relative h-44 sm:h-56 w-full overflow-hidden"
        style={{
          background:
            page.bannerGradient ||
            'linear-gradient(135deg, #D8EEF5 0%, #FBE2EA 55%, #E4EED8 100%)',
        }}
      >
        {page.bannerImage && (
          <img
            src={page.bannerImage}
            alt={`${page.title} banner`}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        )}

        {/* Top Floating Action Strip on Banner */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBannerPicker((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Change Banner</span>
            </button>
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Theme</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner Art Picker Popover */}
      {showBannerPicker && (
        <div className="mx-auto max-w-5xl px-6 pt-4">
          <div
            className={`p-4 shadow-md ${radiusClass}`}
            style={{
              backgroundColor: theme.surfaceBg,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>
                Choose Banner &amp; Card Cover
              </span>
              <div className="flex items-center gap-3">
                <label
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: theme.accentSoft,
                    color: theme.accentText,
                  }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowBannerPicker(false)}
                  className="text-xs"
                  style={{ color: theme.textMuted }}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {ART_GALLERY.map((art) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => {
                    onUpdatePage({
                      ...page,
                      bannerImage: art.imageUrl,
                      bannerGradient: art.gradient,
                      coverImage: art.imageUrl,
                      coverGradient: art.gradient,
                    });
                    setShowBannerPicker(false);
                  }}
                  className="group/art overflow-hidden rounded-xl text-left transition-transform hover:scale-[1.02]"
                  style={{ border: `1px solid ${theme.borderColor}` }}
                >
                  <div
                    className="h-16 w-full"
                    style={{ background: art.gradient }}
                  >
                    {art.imageUrl && (
                      <img
                        src={art.imageUrl}
                        alt={art.label}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div
                    className="truncate px-2 py-1 text-[11px] font-medium"
                    style={{ color: theme.textPrimary }}
                  >
                    {art.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content Container */}
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-9">
        {/* Editable Title + Inline Sticker Cluster (Image 2 signature header!) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[260px]">
            <input
              type="text"
              value={page.icon}
              onChange={(e) => onUpdatePage({ ...page, icon: e.target.value || '✨' })}
              aria-label="Page icon"
              className="h-10 w-10 rounded-xl text-center text-2xl focus:outline-none"
              style={{
                backgroundColor: theme.surfaceAlt,
                border: `1px solid ${theme.borderColor}`,
              }}
            />
            <input
              type="text"
              value={page.title}
              onChange={(e) =>
                onUpdatePage({ ...page, title: e.target.value, updatedAt: 'Just now' })
              }
              aria-label="Page title"
              className="font-display flex-1 min-w-[220px] bg-transparent text-2xl sm:text-3xl font-bold tracking-tight focus:outline-none"
              style={{ color: theme.textPrimary }}
            />

            {/* Inline Sticker Cluster */}
            <div className="relative flex items-center gap-1">
              {page.stickers.map((stk, idx) => (
                <button
                  key={`${stk}-${idx}`}
                  type="button"
                  title="Click to remove sticker"
                  onClick={() =>
                    onUpdatePage({
                      ...page,
                      stickers: page.stickers.filter((_, i) => i !== idx),
                    })
                  }
                  className="rounded-lg px-1 py-0.5 text-xl transition-transform hover:scale-125 hover:opacity-70"
                >
                  {stk}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowStickerPicker((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: theme.surfaceAlt,
                  color: theme.textMuted,
                  border: `1px solid ${theme.borderColor}`,
                }}
              >
                <Plus className="h-3 w-3" />
                <span>Sticker</span>
              </button>

              {showStickerPicker && (
                <div
                  className="absolute left-0 top-9 z-30 w-56 rounded-2xl p-3 shadow-xl"
                  style={{
                    backgroundColor: theme.surfaceBg,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                      Tap to add sticker
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowStickerPicker(false)}
                      className="text-[11px]"
                      style={{ color: theme.accent }}
                    >
                      Done
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {STICKER_PACK.map((stk) => (
                      <button
                        key={stk}
                        type="button"
                        onClick={() =>
                          onUpdatePage({
                            ...page,
                            stickers: [...page.stickers, stk],
                          })
                        }
                        className="rounded-lg p-1.5 text-lg hover:bg-black/5"
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean Unboxed Metadata Line */}
        <div
          className="mt-2 flex flex-wrap items-center gap-2 text-xs"
          style={{ color: theme.textMuted }}
        >
          <span className="capitalize">{page.category}</span>
          <span aria-hidden="true">·</span>
          <span className="font-tabular">{page.blocks.length} modular blocks</span>
          <span aria-hidden="true">·</span>
          <span>Updated {page.updatedAt}</span>
        </div>

        {/* Cozy Welcome / Intention Callout Box (Image 2 style!) */}
        <div
          className={`mt-4 flex items-start gap-3 px-4 py-3 ${radiusClass}`}
          style={{
            backgroundColor: theme.surfaceAlt,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          <span className="mt-0.5 text-base shrink-0">{page.calloutIcon}</span>
          <input
            type="text"
            value={page.calloutText}
            onChange={(e) => onUpdatePage({ ...page, calloutText: e.target.value })}
            aria-label="Page welcome quote or intention"
            className="w-full bg-transparent text-xs sm:text-sm leading-relaxed focus:outline-none"
            style={{ color: theme.textPrimary }}
          />
        </div>

        {/* Page Editing Toolbar: Layout Switcher + Add Block */}
        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-3 pb-4"
          style={{ borderBottom: `1px solid ${theme.borderColor}` }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: theme.textMuted }}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>Layout:</span>
            </span>
            <div
              className="inline-flex items-center gap-1 rounded-xl p-1"
              style={{ backgroundColor: theme.surfaceAlt }}
            >
              {(
                [
                  { id: 'studio-split', label: 'Studio 30/70' },
                  { id: 'equal-split', label: 'Balanced 50/50' },
                  { id: 'editorial', label: '1-Column' },
                  { id: 'bento-three', label: '3-Column' },
                ] as { id: PageLayout; label: string }[]
              ).map((lay) => {
                const active = page.layout === lay.id;
                return (
                  <button
                    key={lay.id}
                    type="button"
                    onClick={() => onUpdatePage({ ...page, layout: lay.id })}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: active ? theme.surfaceBg : 'transparent',
                      color: active ? theme.accent : theme.textMuted,
                    }}
                  >
                    {lay.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddBlock((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
            style={{ backgroundColor: theme.accent }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Widget / Block</span>
          </button>
        </div>

        {/* Add Modular Block Catalog Drawer */}
        {showAddBlock && (
          <div
            className={`mt-5 p-4 ${radiusClass}`}
            style={{
              backgroundColor: theme.surfaceAlt,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>
                Click any widget or block to add it to this page
              </span>
              <button
                type="button"
                onClick={() => setShowAddBlock(false)}
                className="text-xs font-medium"
                style={{ color: theme.textMuted }}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {BLOCK_CATALOG.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    const col: BlockColumn =
                      page.layout === 'editorial' ? 'full' : item.defaultCol;
                    const newBlock = createDefaultBlock(item.type, col);
                    onUpdatePage({
                      ...page,
                      updatedAt: 'Just now',
                      blocks: [...page.blocks, newBlock],
                    });
                    setShowAddBlock(false);
                  }}
                  className="flex items-start gap-3 rounded-xl p-3 text-left transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: theme.surfaceBg,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: theme.accentSoft,
                      color: theme.accent,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-xs font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="mt-0.5 text-[11px]"
                      style={{ color: theme.textMuted }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modular Drag-and-Drop Multi-Column Canvas */}
        <div className="mt-6 flex flex-col gap-5">
          {/* Full-width top blocks (or all blocks in 1-col / 3-col mode) */}
          {page.layout === 'editorial' ? (
            renderBlockList(
              page.blocks,
              'full',
              'Empty canvas — click "+ Add Widget / Block" above to start building!'
            )
          ) : page.layout === 'bento-three' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {page.blocks.length === 0 ? (
                <div
                  className="col-span-full rounded-2xl p-10 text-center text-xs"
                  style={{
                    border: `1px dashed ${theme.borderColor}`,
                    color: theme.textMuted,
                  }}
                >
                  Empty 3-column canvas — click &quot;+ Add Widget / Block&quot; to add widgets!
                </div>
              ) : (
                page.blocks.map((blk) => (
                  <BlockRenderer
                    key={blk.id}
                    block={blk}
                    theme={theme}
                    radiusClass={radiusClass}
                    onUpdate={handleUpdateBlock}
                    onDelete={() => handleDeleteBlock(blk.id)}
                    onMoveOrder={(dir) => handleMoveBlockOrder(blk.id, dir)}
                    onMoveColumn={(nextCol) => handleMoveBlockColumn(blk.id, nextCol)}
                    onDragStart={() => setDragBlockId(blk.id)}
                    onDragEnd={() => {
                      setDragBlockId(null);
                      setDragOverCol(null);
                    }}
                    onDropOnBlock={() => handleDropOnBlock(blk.id)}
                  />
                ))
              )}
            </div>
          ) : (
            <>
              {fullBlocks.length > 0 &&
                renderBlockList(fullBlocks, 'full', 'Drop full-width blocks here')}

              <div
                className={`grid grid-cols-1 gap-5 items-start ${
                  page.layout === 'studio-split'
                    ? 'lg:grid-cols-[310px_minmax(0,1fr)]'
                    : 'lg:grid-cols-2'
                }`}
              >
                {renderBlockList(
                  leftBlocks,
                  'left',
                  'Left column — drag a block here or add a Flip Clock / Checklist'
                )}
                {renderBlockList(
                  rightBlocks,
                  'right',
                  'Main column — drag a block here or add a Visual Grid / Table'
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
