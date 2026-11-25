import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Check,
  GripVertical,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { ART_GALLERY, HIGHLIGHT_STYLES } from '../data/presets';
import {
  BlockColumn,
  HighlightColor,
  PageBlock,
  ThemeDefinition,
  VisualCardItem,
} from '../types/planner';

interface BlockRendererProps {
  block: PageBlock;
  theme: ThemeDefinition;
  radiusClass: string;
  onUpdate: (updated: PageBlock) => void;
  onDelete: () => void;
  onMoveOrder: (direction: 'up' | 'down') => void;
  onMoveColumn: (col: BlockColumn) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOnBlock: () => void;
}

const HIGHLIGHT_KEYS: HighlightColor[] = ['butter', 'blush', 'sage', 'sky', 'lavender'];

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  theme,
  radiusClass,
  onUpdate,
  onDelete,
  onMoveOrder,
  onMoveColumn,
  onDragStart,
  onDragEnd,
  onDropOnBlock,
}) => {
  const [newItemText, setNewItemText] = useState('');
  const [newHabitText, setNewHabitText] = useState('');
  const [editingCard, setEditingCard] = useState<VisualCardItem | null>(null);

  // Live clock state for flip-clock block
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (block.type !== 'flip-clock') return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [block.type]);

  // Focus timer state
  const initialSeconds = (block.focusMinutes ?? 25) * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    setSecondsLeft((block.focusMinutes ?? 25) * 60);
    setTimerRunning(false);
  }, [block.focusMinutes]);

  useEffect(() => {
    if (!timerRunning || block.type !== 'focus-timer') return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, block.type]);

  const getHighlight = (color: HighlightColor = 'butter') => {
    const h = HIGHLIGHT_STYLES[color];
    return {
      bg: theme.isDark ? h.darkBg : h.bg,
      text: theme.isDark ? h.darkText : h.text,
      dot: h.dot,
    };
  };

  const nextColumn = (): BlockColumn => {
    if (block.column === 'left') return 'right';
    if (block.column === 'right') return 'full';
    return 'left';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropOnBlock();
      }}
      className={`group relative transition-shadow ${radiusClass}`}
      style={{
        backgroundColor: theme.surfaceBg,
        border: `1px solid ${theme.borderColor}`,
      }}
    >
      {/* Subtle Top Block Control Strip (appears cleanly on hover/focus-within) */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-1.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
        style={{
          borderBottom: `1px solid ${theme.borderColor}`,
          backgroundColor: theme.surfaceAlt,
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="cursor-grab p-0.5 rounded hover:bg-black/5"
            title="Drag block to reorder or move columns"
            style={{ color: theme.textMuted }}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            aria-label="Block title"
            className="min-w-0 bg-transparent text-[11px] font-semibold focus:outline-none truncate"
            style={{ color: theme.textMuted }}
          />
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            title="Move up"
            onClick={() => onMoveOrder('up')}
            className="rounded p-1 hover:bg-black/5"
            style={{ color: theme.textMuted }}
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Move down"
            onClick={() => onMoveOrder('down')}
            className="rounded p-1 hover:bg-black/5"
            style={{ color: theme.textMuted }}
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            title={`Move to ${nextColumn()} column`}
            onClick={() => onMoveColumn(nextColumn())}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium hover:bg-black/5"
            style={{ color: theme.textMuted }}
          >
            <ArrowLeftRight className="h-3 w-3" />
            <span className="capitalize">{block.column}</span>
          </button>
          <button
            type="button"
            title="Delete block"
            onClick={onDelete}
            className="rounded p-1 text-rose-500 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Block Body */}
      <div className="p-4">
        {/* 1. CHECKLIST BLOCK (Image 2 Highlight Header Style) */}
        {block.type === 'checklist' && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div
                className="flex-1 rounded-md px-2.5 py-1.5"
                style={{
                  backgroundColor: getHighlight(block.highlightColor).bg,
                }}
              >
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                  className="w-full bg-transparent text-sm font-bold focus:outline-none"
                  style={{ color: getHighlight(block.highlightColor).text }}
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {HIGHLIGHT_KEYS.map((hk) => (
                  <button
                    key={hk}
                    type="button"
                    aria-label={`Set ${hk} highlight`}
                    onClick={() => onUpdate({ ...block, highlightColor: hk })}
                    className={`h-3.5 w-3.5 rounded-full transition-transform ${
                      block.highlightColor === hk ? 'scale-125 ring-1 ring-black/30' : ''
                    }`}
                    style={{ backgroundColor: HIGHLIGHT_STYLES[hk].dot }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {(block.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="group/item flex items-start gap-2 rounded-lg px-1 py-1 hover:bg-black/[0.025]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({
                        ...block,
                        items: (block.items ?? []).map((it) =>
                          it.id === item.id ? { ...it, done: !it.done } : it
                        ),
                      })
                    }
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                    style={{
                      backgroundColor: item.done ? theme.accent : 'transparent',
                      borderColor: item.done ? theme.accent : theme.borderColor,
                      color: '#FFFFFF',
                    }}
                  >
                    {item.done && <Check className="h-3 w-3 stroke-[2.5]" />}
                  </button>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) =>
                      onUpdate({
                        ...block,
                        items: (block.items ?? []).map((it) =>
                          it.id === item.id ? { ...it, text: e.target.value } : it
                        ),
                      })
                    }
                    className={`flex-1 min-w-0 bg-transparent text-xs leading-relaxed focus:outline-none ${
                      item.done ? 'line-through opacity-55' : ''
                    }`}
                    style={{ color: theme.textPrimary }}
                  />
                  <button
                    type="button"
                    aria-label="Delete item"
                    onClick={() =>
                      onUpdate({
                        ...block,
                        items: (block.items ?? []).filter((it) => it.id !== item.id),
                      })
                    }
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-neutral-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = newItemText.trim();
                if (!val) return;
                onUpdate({
                  ...block,
                  items: [
                    ...(block.items ?? []),
                    { id: `chk-${Date.now()}`, text: val, done: false },
                  ],
                });
                setNewItemText('');
              }}
              className="mt-2.5 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="+ Add checklist item..."
                className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                style={{
                  backgroundColor: theme.surfaceAlt,
                  color: theme.textPrimary,
                }}
              />
              {newItemText.trim() && (
                <button
                  type="submit"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: theme.accent }}
                >
                  Add
                </button>
              )}
            </form>
          </div>
        )}

        {/* 2. FLIP CLOCK WIDGET (Image 2 Pink Split-Flap Clock!) */}
        {block.type === 'flip-clock' && (() => {
          const is24 = block.clockFormat === '24h';
          const rawHours = now.getHours();
          const displayHours = is24 ? rawHours : rawHours % 12 || 12;
          const hoursStr = String(displayHours).padStart(2, '0');
          const minsStr = String(now.getMinutes()).padStart(2, '0');
          const ampm = rawHours >= 12 ? 'PM' : 'AM';
          const weekday = now
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toUpperCase();
          const tint = getHighlight(block.clockTint ?? 'blush');

          return (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {HIGHLIGHT_KEYS.map((hk) => (
                    <button
                      key={hk}
                      type="button"
                      aria-label={`Set clock color ${hk}`}
                      onClick={() => onUpdate({ ...block, clockTint: hk })}
                      className={`h-3.5 w-3.5 rounded-full ${
                        (block.clockTint ?? 'blush') === hk
                          ? 'scale-125 ring-1 ring-black/30'
                          : ''
                      }`}
                      style={{ backgroundColor: HIGHLIGHT_STYLES[hk].dot }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({ ...block, clockFormat: is24 ? '12h' : '24h' })
                  }
                  className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    color: theme.textMuted,
                  }}
                >
                  {is24 ? '24H' : '12H'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className="flip-tile relative flex h-28 items-center justify-center rounded-xl shadow-inner"
                  style={{ backgroundColor: tint.bg, color: tint.text }}
                >
                  <span className="font-display text-5xl font-bold font-tabular tracking-tight">
                    {hoursStr}
                  </span>
                  {!is24 && (
                    <span className="absolute bottom-2 left-2.5 text-[10px] font-bold tracking-wider opacity-75">
                      {ampm}
                    </span>
                  )}
                </div>
                <div
                  className="flip-tile relative flex h-28 items-center justify-center rounded-xl shadow-inner"
                  style={{ backgroundColor: tint.bg, color: tint.text }}
                >
                  <span className="font-display text-5xl font-bold font-tabular tracking-tight">
                    {minsStr}
                  </span>
                  <span className="absolute bottom-2 right-2.5 text-[10px] font-bold tracking-wider opacity-75">
                    {weekday}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. POSTAGE STAMP & STICKER KEEPSAKE (Image 2 Bottom Left!) */}
        {block.type === 'stamp-sticker' && (
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-xl bg-neutral-100">
              <img
                src={block.stampImage || ART_GALLERY[4].imageUrl}
                alt={block.title}
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover"
              />
              <div className="absolute bottom-2 right-2 flex gap-1">
                {ART_GALLERY.filter((a) => a.imageUrl)
                  .slice(0, 4)
                  .map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      title={`Use ${art.label}`}
                      onClick={() =>
                        onUpdate({ ...block, stampImage: art.imageUrl })
                      }
                      className="h-6 w-6 overflow-hidden rounded-md border border-white shadow-sm hover:scale-110 transition-transform"
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
            </div>

            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: getHighlight('blush').bg }}
            >
              <textarea
                rows={2}
                value={block.stampCaption ?? ''}
                onChange={(e) =>
                  onUpdate({ ...block, stampCaption: e.target.value })
                }
                placeholder="Write a cozy keepsake note..."
                className="w-full resize-none bg-transparent text-xs leading-relaxed focus:outline-none"
                style={{ color: getHighlight('blush').text }}
              />
            </div>
          </div>
        )}

        {/* 4. ILLUSTRATED VISUAL CARDS GRID (Image 2 Monthly Anecdotes Grid!) */}
        {block.type === 'visual-grid' && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <input
                type="text"
                value={block.title}
                onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                className="flex-1 bg-transparent text-base font-bold focus:outline-none"
                style={{ color: theme.textPrimary }}
              />
              <button
                type="button"
                onClick={() => {
                  const cards = block.visualCards ?? [];
                  const nextNum = cards.length + 1;
                  const sampleArt = ART_GALLERY[nextNum % ART_GALLERY.length];
                  onUpdate({
                    ...block,
                    visualCards: [
                      ...cards,
                      {
                        id: `vc-${Date.now()}`,
                        label: `Milestone ${nextNum}`,
                        note: 'Click to edit notes & reflection...',
                        imageUrl: sampleArt.imageUrl,
                        gradient: sampleArt.gradient,
                        completed: false,
                      },
                    ],
                  });
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: theme.accentSoft,
                  color: theme.accentText,
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Card</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(block.visualCards ?? []).map((card) => (
                <div
                  key={card.id}
                  onClick={() => setEditingCard(card)}
                  className="group/card cursor-pointer overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5"
                  style={{
                    border: `1px solid ${theme.borderColor}`,
                    backgroundColor: theme.surfaceAlt,
                  }}
                >
                  <div
                    className="relative h-20 w-full overflow-hidden"
                    style={{
                      background:
                        card.gradient ||
                        'linear-gradient(135deg, #E8F3E4 0%, #FCEBF0 100%)',
                    }}
                  >
                    {card.imageUrl && (
                      <img
                        src={card.imageUrl}
                        alt={card.label}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      aria-label={`Toggle ${card.label} complete`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({
                          ...block,
                          visualCards: (block.visualCards ?? []).map((c) =>
                            c.id === card.id
                              ? { ...c, completed: !c.completed }
                              : c
                          ),
                        });
                      }}
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm"
                      style={{
                        color: card.completed ? theme.accent : '#A3A3A3',
                      }}
                    >
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </button>
                  </div>
                  <div className="px-2.5 py-2">
                    <div
                      className="truncate text-xs font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {card.label}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[11px]"
                      style={{ color: theme.textMuted }}
                    >
                      {card.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline Modal to edit clicked Visual Card */}
            {editingCard && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onClick={() => setEditingCard(null)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md rounded-2xl p-5 shadow-xl"
                  style={{
                    backgroundColor: theme.surfaceBg,
                    border: `1px solid ${theme.borderColor}`,
                    color: theme.textPrimary,
                  }}
                >
                  <h4 className="text-sm font-bold">Edit Milestone Card</h4>
                  <div className="mt-3 flex flex-col gap-3">
                    <div>
                      <label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
                        Title / Month
                      </label>
                      <input
                        type="text"
                        value={editingCard.label}
                        onChange={(e) =>
                          setEditingCard({ ...editingCard, label: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                        style={{
                          backgroundColor: theme.surfaceAlt,
                          border: `1px solid ${theme.borderColor}`,
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
                        Anecdote / Reflection
                      </label>
                      <textarea
                        rows={3}
                        value={editingCard.note}
                        onChange={(e) =>
                          setEditingCard({ ...editingCard, note: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                        style={{
                          backgroundColor: theme.surfaceAlt,
                          border: `1px solid ${theme.borderColor}`,
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
                        Cover Illustration
                      </label>
                      <div className="mt-1.5 grid grid-cols-4 gap-2">
                        {ART_GALLERY.map((art) => (
                          <button
                            key={art.id}
                            type="button"
                            onClick={() =>
                              setEditingCard({
                                ...editingCard,
                                imageUrl: art.imageUrl,
                                gradient: art.gradient,
                              })
                            }
                            className="h-11 overflow-hidden rounded-lg border-2"
                            style={{
                              background: art.gradient,
                              borderColor:
                                editingCard.imageUrl === art.imageUrl &&
                                editingCard.gradient === art.gradient
                                  ? theme.accent
                                  : 'transparent',
                            }}
                          >
                            {art.imageUrl && (
                              <img
                                src={art.imageUrl}
                                alt={art.label}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdate({
                          ...block,
                          visualCards: (block.visualCards ?? []).filter(
                            (c) => c.id !== editingCard.id
                          ),
                        });
                        setEditingCard(null);
                      }}
                      className="text-xs font-medium text-rose-500 hover:underline"
                    >
                      Delete Card
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCard(null)}
                        className="rounded-xl px-3.5 py-2 text-xs font-medium"
                        style={{ backgroundColor: theme.surfaceAlt }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate({
                            ...block,
                            visualCards: (block.visualCards ?? []).map((c) =>
                              c.id === editingCard.id ? editingCard : c
                            ),
                          });
                          setEditingCard(null);
                        }}
                        className="rounded-xl px-4 py-2 text-xs font-semibold text-white"
                        style={{ backgroundColor: theme.accent }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. STRUCTURED GOAL / ANECDOTE TABLE (Image 2 Bottom Right Table!) */}
        {block.type === 'goal-table' && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <input
                type="text"
                value={block.title}
                onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                className="flex-1 bg-transparent text-base font-bold focus:outline-none"
                style={{ color: theme.textPrimary }}
              />
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...block,
                    tableRows: [
                      ...(block.tableRows ?? []),
                      {
                        id: `row-${Date.now()}`,
                        category: 'general',
                        categoryTint: 'sky',
                        subject: 'New entry',
                        notes: 'Write details or reflection here...',
                        target: 'In progress',
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: theme.accentSoft,
                  color: theme.accentText,
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
                    {(block.tableColumns ?? ['Category', 'Subject', 'Notes', 'Target']).map(
                      (colName, i) => (
                        <th
                          key={i}
                          className="py-2 pr-3 font-medium"
                          style={{ color: theme.textMuted }}
                        >
                          {colName}
                        </th>
                      )
                    )}
                    <th className="w-8 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(block.tableRows ?? []).map((row) => {
                    const catStyle = getHighlight(row.categoryTint);
                    return (
                      <tr
                        key={row.id}
                        className="group/row"
                        style={{ borderBottom: `1px solid ${theme.borderColor}` }}
                      >
                        <td className="py-2.5 pr-3 align-top">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="Cycle tag color"
                              onClick={() => {
                                const nextIdx =
                                  (HIGHLIGHT_KEYS.indexOf(row.categoryTint) + 1) %
                                  HIGHLIGHT_KEYS.length;
                                onUpdate({
                                  ...block,
                                  tableRows: (block.tableRows ?? []).map((r) =>
                                    r.id === row.id
                                      ? { ...r, categoryTint: HIGHLIGHT_KEYS[nextIdx] }
                                      : r
                                  ),
                                });
                              }}
                              className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                              style={{
                                backgroundColor: catStyle.bg,
                                color: catStyle.text,
                              }}
                            >
                              <input
                                type="text"
                                value={row.category}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  onUpdate({
                                    ...block,
                                    tableRows: (block.tableRows ?? []).map((r) =>
                                      r.id === row.id
                                        ? { ...r, category: e.target.value }
                                        : r
                                    ),
                                  })
                                }
                                className="w-16 bg-transparent focus:outline-none"
                              />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          <input
                            type="text"
                            value={row.subject}
                            onChange={(e) =>
                              onUpdate({
                                ...block,
                                tableRows: (block.tableRows ?? []).map((r) =>
                                  r.id === row.id
                                    ? { ...r, subject: e.target.value }
                                    : r
                                ),
                              })
                            }
                            className="w-full min-w-[110px] bg-transparent font-medium focus:outline-none"
                            style={{ color: theme.textPrimary }}
                          />
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          <textarea
                            rows={2}
                            value={row.notes}
                            onChange={(e) =>
                              onUpdate({
                                ...block,
                                tableRows: (block.tableRows ?? []).map((r) =>
                                  r.id === row.id
                                    ? { ...r, notes: e.target.value }
                                    : r
                                ),
                              })
                            }
                            className="w-full min-w-[180px] resize-none bg-transparent leading-relaxed focus:outline-none"
                            style={{ color: theme.textPrimary }}
                          />
                        </td>
                        <td className="py-2.5 pr-2 align-top">
                          <input
                            type="text"
                            value={row.target}
                            onChange={(e) =>
                              onUpdate({
                                ...block,
                                tableRows: (block.tableRows ?? []).map((r) =>
                                  r.id === row.id
                                    ? { ...r, target: e.target.value }
                                    : r
                                ),
                              })
                            }
                            className="w-24 bg-transparent font-tabular focus:outline-none"
                            style={{ color: theme.textMuted }}
                          />
                        </td>
                        <td className="py-2.5 align-top">
                          <button
                            type="button"
                            aria-label="Delete row"
                            onClick={() =>
                              onUpdate({
                                ...block,
                                tableRows: (block.tableRows ?? []).filter(
                                  (r) => r.id !== row.id
                                ),
                              })
                            }
                            className="opacity-0 group-hover/row:opacity-100 p-1 text-neutral-400 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. 7-DAY HABIT TRACKER MATRIX */}
        {block.type === 'habit-tracker' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <input
                type="text"
                value={block.title}
                onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                className="flex-1 bg-transparent text-base font-bold focus:outline-none"
                style={{ color: theme.textPrimary }}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: theme.textMuted }}>
                    <th className="pb-2 text-left font-medium">Habit</th>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                      <th key={d} className="pb-2 text-center font-medium w-9">
                        {d}
                      </th>
                    ))}
                    <th className="pb-2 text-right font-medium w-12">Rate</th>
                    <th className="w-7" />
                  </tr>
                </thead>
                <tbody>
                  {(block.habits ?? []).map((habit) => {
                    const count = habit.days.filter(Boolean).length;
                    const pct = Math.round((count / 7) * 100);
                    return (
                      <tr
                        key={habit.id}
                        className="group/hab"
                        style={{ borderTop: `1px solid ${theme.borderColor}` }}
                      >
                        <td className="py-2.5 pr-3">
                          <input
                            type="text"
                            value={habit.name}
                            onChange={(e) =>
                              onUpdate({
                                ...block,
                                habits: (block.habits ?? []).map((h) =>
                                  h.id === habit.id ? { ...h, name: e.target.value } : h
                                ),
                              })
                            }
                            className="w-full min-w-[130px] bg-transparent font-medium focus:outline-none"
                            style={{ color: theme.textPrimary }}
                          />
                        </td>
                        {habit.days.map((done, dIdx) => (
                          <td key={dIdx} className="py-2.5 text-center">
                            <button
                              type="button"
                              aria-label={`${habit.name} day ${dIdx + 1}`}
                              onClick={() =>
                                onUpdate({
                                  ...block,
                                  habits: (block.habits ?? []).map((h) =>
                                    h.id === habit.id
                                      ? {
                                          ...h,
                                          days: h.days.map((v, i) =>
                                            i === dIdx ? !v : v
                                          ),
                                        }
                                      : h
                                  ),
                                })
                              }
                              className="mx-auto flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                              style={{
                                backgroundColor: done ? theme.accent : theme.surfaceAlt,
                                color: done ? '#FFFFFF' : theme.textMuted,
                              }}
                            >
                              {done && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                            </button>
                          </td>
                        ))}
                        <td
                          className="py-2.5 text-right font-semibold font-tabular"
                          style={{ color: theme.accent }}
                        >
                          {pct}%
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            aria-label="Delete habit"
                            onClick={() =>
                              onUpdate({
                                ...block,
                                habits: (block.habits ?? []).filter(
                                  (h) => h.id !== habit.id
                                ),
                              })
                            }
                            className="opacity-0 group-hover/hab:opacity-100 p-1 text-neutral-400 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = newHabitText.trim();
                if (!name) return;
                onUpdate({
                  ...block,
                  habits: [
                    ...(block.habits ?? []),
                    {
                      id: `hab-${Date.now()}`,
                      name,
                      days: [false, false, false, false, false, false, false],
                    },
                  ],
                });
                setNewHabitText('');
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={newHabitText}
                onChange={(e) => setNewHabitText(e.target.value)}
                placeholder="+ Add a weekly habit..."
                className="flex-1 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                style={{
                  backgroundColor: theme.surfaceAlt,
                  color: theme.textPrimary,
                }}
              />
              {newHabitText.trim() && (
                <button
                  type="submit"
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: theme.accent }}
                >
                  Add
                </button>
              )}
            </form>
          </div>
        )}

        {/* 7. BRAIN DUMP / COZY NOTE */}
        {block.type === 'brain-dump' && (() => {
          const tint = getHighlight(block.noteTint ?? 'butter');
          return (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: tint.bg }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-bold focus:outline-none"
                  style={{ color: tint.text }}
                />
                <div className="flex items-center gap-1">
                  {HIGHLIGHT_KEYS.map((hk) => (
                    <button
                      key={hk}
                      type="button"
                      aria-label={`Set note tint ${hk}`}
                      onClick={() => onUpdate({ ...block, noteTint: hk })}
                      className={`h-3.5 w-3.5 rounded-full ${
                        (block.noteTint ?? 'butter') === hk
                          ? 'scale-125 ring-1 ring-black/30'
                          : ''
                      }`}
                      style={{ backgroundColor: HIGHLIGHT_STYLES[hk].dot }}
                    />
                  ))}
                </div>
              </div>
              <textarea
                rows={5}
                value={block.noteContent ?? ''}
                onChange={(e) =>
                  onUpdate({ ...block, noteContent: e.target.value })
                }
                placeholder="Write freely — ideas, reflections, gratitude, or reminders..."
                className="w-full resize-y bg-transparent text-xs leading-relaxed focus:outline-none"
                style={{ color: tint.text }}
              />
            </div>
          );
        })()}

        {/* 8. GOAL PROGRESS METER */}
        {block.type === 'progress-meter' && (() => {
          const curr = block.currentValue ?? 0;
          const target = Math.max(1, block.targetValue ?? 10);
          const pct = Math.min(100, Math.round((curr / target) * 100));
          const r = 34;
          const c = 2 * Math.PI * r;
          const offset = c - (pct / 100) * c;

          return (
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
                  <circle
                    cx="42"
                    cy="42"
                    r={r}
                    fill="none"
                    stroke={theme.surfaceAlt}
                    strokeWidth="8"
                  />
                  <circle
                    cx="42"
                    cy="42"
                    r={r}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-tabular">
                  {pct}%
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                  className="w-full bg-transparent text-sm font-bold focus:outline-none"
                  style={{ color: theme.textPrimary }}
                />
                <div
                  className="mt-1 text-xs font-tabular"
                  style={{ color: theme.textMuted }}
                >
                  {curr} / {target} {block.unitLabel || 'units'}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease progress"
                    onClick={() =>
                      onUpdate({ ...block, currentValue: Math.max(0, curr - 1) })
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: theme.surfaceAlt,
                      border: `1px solid ${theme.borderColor}`,
                    }}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Increase progress"
                    onClick={() => onUpdate({ ...block, currentValue: curr + 1 })}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={target}
                    onChange={(e) =>
                      onUpdate({
                        ...block,
                        targetValue: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    aria-label="Target value"
                    className="w-14 rounded-lg px-2 py-1 text-xs font-tabular focus:outline-none"
                    style={{
                      backgroundColor: theme.surfaceAlt,
                      border: `1px solid ${theme.borderColor}`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* 9. COZY FOCUS TIMER */}
        {block.type === 'focus-timer' && (() => {
          const mins = Math.floor(secondsLeft / 60);
          const secs = secondsLeft % 60;
          const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          return (
            <div className="flex flex-col items-center text-center py-1">
              <div className="flex gap-1.5 mb-3">
                {[15, 25, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onUpdate({ ...block, focusMinutes: m })}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-semibold font-tabular"
                    style={{
                      backgroundColor:
                        (block.focusMinutes ?? 25) === m
                          ? theme.accentSoft
                          : theme.surfaceAlt,
                      color:
                        (block.focusMinutes ?? 25) === m
                          ? theme.accentText
                          : theme.textMuted,
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <div
                className="font-display text-4xl font-bold font-tabular tracking-tight"
                style={{ color: theme.textPrimary }}
              >
                {timeStr}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: theme.accent }}
                >
                  {timerRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      <span>Start</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Reset timer"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsLeft((block.focusMinutes ?? 25) * 60);
                  }}
                  className="rounded-xl p-2"
                  style={{
                    backgroundColor: theme.surfaceAlt,
                    color: theme.textMuted,
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
