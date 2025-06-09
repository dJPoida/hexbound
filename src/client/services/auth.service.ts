const TOKEN_KEY = 'hexbound_session_token';
const USER_ID_KEY = 'hexbound_user_id';
const USER_NAME_KEY = 'hexbound_user_name';

export const authService = {
  /**
   * Saves the session token and user details to localStorage.
   * @param token The session token from the server.
   * @param userId The user's ID.
   * @param userName The user's name.
   */
  saveSession(token: string, userId: string, userName: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(USER_NAME_KEY, userName);
  },

  /**
   * Retrieves the current session information from localStorage.
   * @returns An object with session data, or null if no session exists.
   */
  getSession(): { token: string; userId: string; userName: string; } | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = localStorage.getItem(USER_ID_KEY);
    const userName = localStorage.getItem(USER_NAME_KEY);

    if (token && userId && userName) {
      return { token, userId, userName };
    }
    return null;
  },

  /**
   * Clears all session information from localStorage.
   */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
  },

  /**
   * Retrieves just the authentication token from localStorage.
   * @returns The token, or null if it doesn't exist.
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
}; 