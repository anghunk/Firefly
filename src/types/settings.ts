/**
 * Combined config for the application
 * - notesDirectory and theme are stored locally (device-specific)
 * - Editor settings are stored in .firefly/config.json (sync across devices)
 */
export interface AppConfig {
  notesDirectory: string;
  theme: 'light' | 'dark' | 'system';
  editorFontSize: number;
  editorLineHeight: number;
  autoSaveDelay: number;
  showLineNumbers: boolean;
}

export const defaultAppConfig: AppConfig = {
  notesDirectory: '',
  theme: 'system',
  editorFontSize: 14,
  editorLineHeight: 1.6,
  autoSaveDelay: 500,
  showLineNumbers: true,
};

/**
 * Workspace config stored in .firefly/config.json
 * These settings sync across devices
 */
export interface WorkspaceConfig {
  editorFontSize: number;
  editorLineHeight: number;
  autoSaveDelay: number;
  showLineNumbers: boolean;
}

export const defaultWorkspaceConfig: WorkspaceConfig = {
  editorFontSize: 14,
  editorLineHeight: 1.6,
  autoSaveDelay: 500,
  showLineNumbers: true,
};