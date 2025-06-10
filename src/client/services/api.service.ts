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

  const response = await fetch(url, newOptions);

  if (response.status === 401) {
    authService.clearAuthToken();
    window.location.href = '/'; 
  }

  return response;
} 