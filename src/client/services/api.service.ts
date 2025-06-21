import { authService } from './auth.service';

/**
 * A wrapper around the native fetch API that automatically adds the
 * Authorization header for authenticated requests.
 * @param url The URL to fetch.
 * @param options The standard fetch options object.
 * @returns A promise that resolves with the fetch Response.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authService.getToken();

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure Content-Type is set for POST/PUT requests if a body is present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const newOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, newOptions);

    if (response.status === 401) {
      console.log('[API] Unauthorized request. Clearing session and redirecting to login.');
      authService.clearAuthToken();
      window.location.href = '/'; 
    }

    return response;
  } catch (error) {
    console.error(`[API] Network error during authenticated fetch for ${url}:`, error);
    // Re-throw the error so the calling component can handle it (e.g., show a message)
    // This prevents the app from crashing while still allowing for error handling.
    throw error;
  }
} 