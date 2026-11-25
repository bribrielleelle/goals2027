import type { PlannerPage, QuickTodo, WorkspaceSettings } from '../types/planner';

export interface PlannerWorkspace {
  pages: PlannerPage[];
  quickTodos: QuickTodo[];
  settings: WorkspaceSettings;
}

export function createEmptyWorkspace(): PlannerWorkspace {
  return {
    pages: [],
    quickTodos: [],
    settings: {
      workspaceName: 'Komorebi Studio',
      userName: '',
      userInitials: '',
      themeId: 'strawberry-milk',
      fontStyle: 'cozy-sans',
      railStyle: 'tinted',
      radiusStyle: 'cozy',
      streakDays: 0,
      lastCheckInDate: '',
      pinnedStampImage: '',
      pinnedStampCaption: '',
    },
  };
}
