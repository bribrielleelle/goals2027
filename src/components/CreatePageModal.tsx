import React, { useState } from 'react';
import { Sparkles, Upload, X } from 'lucide-react';
import {
  ART_GALLERY,
  GENERATED_ART,
  PAGE_TEMPLATES,
  PageTemplate,
} from '../data/presets';
import {
  PageBlock,
  PageLayout,
  PlannerPage,
  ThemeDefinition,
} from '../types/planner';
import { createDefaultBlock } from './PageWorkspace';

interface CreatePageModalProps {
  theme: ThemeDefinition;
  onClose: () => void;
  onCreate: (newPage: PlannerPage) => void;
}

const ICON_CHOICES = ['🌸', '🥐', '🎯', '🍓', '💌', '📖', '🪴', '✨', '🐇', '🍵', '🌙', '☁️'];

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  theme,
  onClose,
  onCreate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate>(
    PAGE_TEMPLATES[0]
  );
  const [title, setTitle] = useState('My New Cozy Page');
  const [subtitle, setSubtitle] = useState('Custom Goals · Personal Space');
  const [icon, setIcon] = useState('🌸');
  const [layout, setLayout] = useState<PageLayout>('studio-split');
  const [selectedArtId, setSelectedArtId] = useState(ART_GALLERY[1].id);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const buildTemplateBlocks = (tplId: string): PageBlock[] => {
    switch (tplId) {
      case 'tpl-daily':
        return [
          createDefaultBlock('flip-clock', 'left'),
          createDefaultBlock('focus-timer', 'left'),
          createDefaultBlock('checklist', 'right'),
          createDefaultBlock('brain-dump', 'right'),
        ];
      case 'tpl-goals':
        return [
          createDefaultBlock('progress-meter', 'left'),
          createDefaultBlock('checklist', 'left'),
          createDefaultBlock('visual-grid', 'right'),
          createDefaultBlock('goal-table', 'right'),
        ];
      case 'tpl-habits':
        return [
          createDefaultBlock('habit-tracker', 'full'),
          createDefaultBlock('checklist', 'left'),
          createDefaultBlock('brain-dump', 'right'),
        ];
      case 'tpl-journal':
        return [
          createDefaultBlock('flip-clock', 'left'),
          createDefaultBlock('checklist', 'left'),
          createDefaultBlock('stamp-sticker', 'left'),
          createDefaultBlock('visual-grid', 'right'),
          createDefaultBlock('goal-table', 'right'),
        ];
      case 'tpl-braindump':
        return [
          createDefaultBlock('stamp-sticker', 'left'),
          createDefaultBlock('checklist', 'left'),
          createDefaultBlock('brain-dump', 'right'),
        ];
      default:
        return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenArt =
      ART_GALLERY.find((a) => a.id === selectedArtId) ?? ART_GALLERY[0];
    const finalCover = uploadedUrl || chosenArt.imageUrl;
    const finalBanner =
      uploadedUrl || chosenArt.imageUrl || GENERATED_ART.coastalSakuraBanner;

    const newPage: PlannerPage = {
      id: `page-${Date.now()}`,
      title: title.trim() || selectedTemplate.name,
      subtitle: subtitle.trim() || 'Custom Workspace Page',
      category: selectedTemplate.category,
      icon: icon || selectedTemplate.icon,
      coverImage: finalCover,
      coverGradient: chosenArt.gradient,
      bannerImage: finalBanner,
      bannerGradient: chosenArt.gradient,
      accentColor: theme.accent,
      calloutIcon: icon || '✨',
      calloutText:
        'Customize this space however you like — drag blocks between columns, swap colors, and pin your favorite stickers.',
      stickers: [icon || '🌸', '✨', '🎀'],
      layout,
      dueLabel: 'Custom page',
      updatedAt: 'Just now',
      blocks: buildTemplateBlocks(selectedTemplate.id),
    };

    onCreate(newPage);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{
          backgroundColor: theme.surfaceBg,
          border: `1px solid ${theme.borderColor}`,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${theme.borderColor}` }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: theme.accent }} />
            <h2 className="font-display text-base font-bold">Create Custom Page</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Template Picker */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: theme.textMuted }}
            >
              1. Pick a starting template (or blank canvas)
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PAGE_TEMPLATES.map((tpl) => {
                const active = selectedTemplate.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setIcon(tpl.icon);
                      if (title === 'My New Cozy Page' || PAGE_TEMPLATES.some((t) => t.name === title)) {
                        setTitle(tpl.name);
                      }
                    }}
                    className="flex items-start gap-3 rounded-2xl p-3 text-left transition-all"
                    style={{
                      backgroundColor: active ? theme.accentSoft : theme.surfaceAlt,
                      border: `1.5px solid ${
                        active ? theme.accent : theme.borderColor
                      }`,
                    }}
                  >
                    <span className="text-xl leading-none mt-0.5">{tpl.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{tpl.name}</div>
                      <div
                        className="mt-0.5 text-[11px] leading-snug"
                        style={{ color: theme.textMuted }}
                      >
                        {tpl.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title, Subtitle, Icon */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: theme.textMuted }}
              >
                2. Page Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: theme.surfaceAlt,
                  border: `1px solid ${theme.borderColor}`,
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: theme.textMuted }}
              >
                Subtitle / Goal Vibe
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                style={{
                  backgroundColor: theme.surfaceAlt,
                  border: `1px solid ${theme.borderColor}`,
                }}
              />
            </div>
          </div>

          {/* Icon + Layout */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: theme.textMuted }}
              >
                Page Sticker Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_CHOICES.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className="h-8 w-8 rounded-lg text-base transition-transform hover:scale-110"
                    style={{
                      backgroundColor:
                        icon === ic ? theme.accentSoft : theme.surfaceAlt,
                      border: `1px solid ${
                        icon === ic ? theme.accent : theme.borderColor
                      }`,
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: theme.textMuted }}
              >
                Page Layout
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'studio-split', label: 'Studio 30/70' },
                    { id: 'equal-split', label: 'Balanced 50/50' },
                    { id: 'editorial', label: '1-Column' },
                    { id: 'bento-three', label: '3-Column' },
                  ] as { id: PageLayout; label: string }[]
                ).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayout(l.id)}
                    className="rounded-xl px-3 py-2 text-xs font-medium"
                    style={{
                      backgroundColor:
                        layout === l.id ? theme.accentSoft : theme.surfaceAlt,
                      color: layout === l.id ? theme.accentText : theme.textPrimary,
                      border: `1px solid ${
                        layout === l.id ? theme.accent : theme.borderColor
                      }`,
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cover & Banner Art */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                className="text-xs font-semibold"
                style={{ color: theme.textMuted }}
              >
                3. Cover &amp; Banner Artwork
              </label>
              <label
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  backgroundColor: theme.accentSoft,
                  color: theme.accentText,
                }}
              >
                <Upload className="h-3 w-3" />
                <span>Upload Custom Art</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {ART_GALLERY.map((art) => {
                const active = !uploadedUrl && selectedArtId === art.id;
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      setUploadedUrl(null);
                      setSelectedArtId(art.id);
                    }}
                    className="overflow-hidden rounded-xl border-2 text-left transition-transform hover:scale-[1.02]"
                    style={{
                      borderColor: active ? theme.accent : theme.borderColor,
                    }}
                  >
                    <div
                      className="h-12 w-full"
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div
            className="flex items-center justify-end gap-2.5 pt-4"
            style={{ borderTop: `1px solid ${theme.borderColor}` }}
          >
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: theme.surfaceAlt }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: theme.accent }}
            >
              Create &amp; Open Page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
