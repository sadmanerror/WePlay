const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('weplay_token') : null;
  if (!token && typeof window !== 'undefined') {
    try {
      const authRaw = localStorage.getItem('weplay-auth-storage');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed?.state?.token) {
          token = parsed.state.token;
        } else if (parsed?.state?.user?.id) {
          token = `mock-jwt-token-${parsed.state.user.id}`;
        }
      }
    } catch {
      // ignore
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
