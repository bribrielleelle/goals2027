import type { PlannerWorkspace } from '../data/workspaceDefaults';

async function expectWorkspaceResponse(response: Response): Promise<PlannerWorkspace> {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session expired. Sign in again to load your workspace.');
    }
    throw new Error('Your workspace could not be saved. Please try again.');
  }

  return (await response.json()) as PlannerWorkspace;
}

export async function loadWorkspace(signal?: AbortSignal): Promise<PlannerWorkspace> {
  const response = await fetch('/api/workspace', {
    credentials: 'same-origin',
    signal,
  });
  return expectWorkspaceResponse(response);
}

export async function saveWorkspace(
  workspace: PlannerWorkspace
): Promise<PlannerWorkspace> {
  const response = await fetch('/api/workspace', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workspace),
  });
  return expectWorkspaceResponse(response);
}

export async function deleteAccount(): Promise<void> {
  const response = await fetch('/api/account', {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session expired. Sign in again before deleting your account.');
    }
    throw new Error('Your account could not be deleted. Please try again.');
  }
}
