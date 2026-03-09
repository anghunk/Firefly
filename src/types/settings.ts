/**
 * Combined config for the application
 * - notesDirectory and theme are stored locally (device-specific)
 * - showLineNumbers is stored in .firefly/config.json (sync across devices)
 * - minimizeToTray is stored locally (device-specific)
 */
export interface AppConfig {
  notesDirectory: string;
  theme: 'light' | 'dark' | 'system';
  showLineNumbers: boolean;
  minimizeToTray: boolean;
}

export const defaultAppConfig: AppConfig = {
  notesDirectory: '',
  theme: 'system',
  showLineNumbers: true,
  minimizeToTray: true,
};

/**
 * Workspace config stored in .firefly/config.json
 * These settings sync across devices
 */
export interface WorkspaceConfig {
  showLineNumbers: boolean;
}

export const defaultWorkspaceConfig: WorkspaceConfig = {
  showLineNumbers: true,
};