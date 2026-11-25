export type ThemeId =
  | 'strawberry-milk'
  | 'coastal-matcha'
  | 'lavender-fog'
  | 'buttercream-linen'
  | 'midnight-berry';

export type FontStyleId = 'cozy-sans' | 'editorial-serif' | 'stationery-mono';

export type RailStyle = 'tinted' | 'paper';

export type RadiusStyle = 'crisp' | 'cozy' | 'soft';

export type PageCategory = 'daily' | 'goals' | 'habits' | 'journal' | 'projects';

export type PageLayout = 'studio-split' | 'equal-split' | 'editorial' | 'bento-three';

export type BlockColumn = 'left' | 'right' | 'full';

export type BlockType =
  | 'checklist'
  | 'flip-clock'
  | 'stamp-sticker'
  | 'visual-grid'
  | 'goal-table'
  | 'habit-tracker'
  | 'brain-dump'
  | 'progress-meter'
  | 'focus-timer';

export type HighlightColor = 'butter' | 'blush' | 'sage' | 'sky' | 'lavender';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface VisualCardItem {
  id: string;
  label: string;
  note: string;
  imageUrl?: string;
  gradient?: string;
  completed: boolean;
}

export interface TableRowItem {
  id: string;
  category: string;
  categoryTint: HighlightColor;
  subject: string;
  notes: string;
  target: string;
}

export interface HabitItem {
  id: string;
  name: string;
  days: boolean[]; // 7 days Mon-Sun
}

export interface PageBlock {
  id: string;
  type: BlockType;
  column: BlockColumn;
  title: string;
  highlightColor?: HighlightColor;
  // checklist
  items?: ChecklistItem[];
  // flip-clock
  clockFormat?: '12h' | '24h';
  clockTint?: HighlightColor;
  // stamp-sticker
  stampImage?: string;
  stampCaption?: string;
  // visual-grid
  visualCards?: VisualCardItem[];
  // goal-table
  tableColumns?: [string, string, string, string];
  tableRows?: TableRowItem[];
  // habit-tracker
  habits?: HabitItem[];
  // brain-dump
  noteContent?: string;
  noteTint?: HighlightColor;
  // progress-meter
  currentValue?: number;
  targetValue?: number;
  unitLabel?: string;
  // focus-timer
  focusMinutes?: number;
}

export interface PlannerPage {
  id: string;
  title: string;
  subtitle: string;
  category: PageCategory;
  icon: string;
  coverImage?: string;
  coverGradient?: string;
  bannerImage?: string;
  bannerGradient?: string;
  accentColor: string;
  calloutIcon: string;
  calloutText: string;
  stickers: string[];
  layout: PageLayout;
  dueLabel: string;
  updatedAt: string;
  blocks: PageBlock[];
}

export interface QuickTodo {
  id: string;
  text: string;
  done: boolean;
  pageId?: string;
  bucket: 'focus' | 'upcoming' | 'done';
}

export interface WorkspaceSettings {
  workspaceName: string;
  userName: string;
  userInitials: string;
  themeId: ThemeId;
  fontStyle: FontStyleId;
  railStyle: RailStyle;
  radiusStyle: RadiusStyle;
  customAccent?: string;
  streakDays: number;
  lastCheckInDate: string;
  pinnedStampImage: string;
  pinnedStampCaption: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  canvasBg: string;
  surfaceBg: string;
  surfaceAlt: string;
  railBg: string;
  railText: string;
  railActiveBg: string;
  railActiveText: string;
  borderColor: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
}
