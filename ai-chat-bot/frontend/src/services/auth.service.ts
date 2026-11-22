import type { AuthSession } from '../types/chat';

const DEFAULT_SESSION: AuthSession = {
  userId: 'local-owner',
  displayName: 'Profile & Knowledge Base',
  role: 'owner',
};

export interface AuthService {
  getSession(): Promise<AuthSession>;
  signInDemo(): Promise<AuthSession>;
  signOutDemo(): Promise<AuthSession>;
}

export const authService: AuthService = {
  async getSession(): Promise<AuthSession> {
    return DEFAULT_SESSION;
  },

  async signInDemo(): Promise<AuthSession> {
    return DEFAULT_SESSION;
  },

  async signOutDemo(): Promise<AuthSession> {
    return {
      userId: 'guest-viewer',
      displayName: 'Guest Viewer',
      role: 'guest',
    };
  },
};