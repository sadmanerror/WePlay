import { User, RegisterInput } from '../types';
import { mockUsers } from '../mocks/users';
import { apiFetch } from './api-client';

const users: User[] = [...mockUsers];

export const login = async (email: string, password: string): Promise<{user: User, token: string}> => {
  try {
    const data = await apiFetch<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('weplay_token', data.access_token);
    }
    return { user: data.user, token: data.access_token };
  } catch {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found with this email. Use rafiq@example.com for demo.');
    const token = `mock-jwt-token-${user.id}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('weplay_token', token);
    }
    return { user, token };
  }
};

export const register = async (input: RegisterInput): Promise<{user: User, token: string}> => {
  try {
    const data = await apiFetch<{ access_token: string; refresh_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        password: input.password,
        preferred_sports: input.preferredSports,
      }),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('weplay_token', data.access_token);
    }
    return { user: data.user, token: data.access_token };
  } catch {
    const newUser: User = {
      id: `u${Date.now()}`,
      name: input.name,
      email: input.email,
      avatarUrl: null,
      preferredSports: input.preferredSports,
      reliabilityScore: 100,
      matchesPlayed: 0,
      matchesHosted: 0,
      joinedAt: new Date().toISOString(),
      bio: '',
    };
    users.push(newUser);
    const token = `mock-jwt-token-${newUser.id}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('weplay_token', token);
    }
    return { user: newUser, token };
  }
};

export const getUser = async (id: string): Promise<User> => {
  try {
    return await apiFetch<User>(`/users/${id}`);
  } catch {
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  }
};

export const updateProfile = async (id: string, updates: Partial<User>): Promise<User> => {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem('weplay_token');
    if (!existing) {
      localStorage.setItem('weplay_token', `mock-jwt-token-${id}`);
    }
  }

  const payload = {
    name: updates.name,
    bio: updates.bio,
    description: updates.description ?? updates.bio,
    preferred_sports: updates.preferredSports,
    avatar_url: updates.avatarUrl,
  };

  try {
    return await apiFetch<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch {
    try {
      return await apiFetch<User>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch {
      const index = users.findIndex(u => u.id === id);
      if (index === -1) {
        const fallbackUser: User = {
          id,
          name: updates.name || 'User',
          email: updates.email || `${id}@example.com`,
          avatarUrl: updates.avatarUrl || null,
          preferredSports: updates.preferredSports || [],
          reliabilityScore: 100,
          matchesPlayed: 0,
          matchesHosted: 0,
          joinedAt: new Date().toISOString(),
          bio: updates.bio || '',
          description: updates.description || updates.bio || '',
          ...updates,
        };
        users.push(fallbackUser);
        return fallbackUser;
      }
      users[index] = { ...users[index], ...updates };
      return users[index];
    }
  }
};

export const toggleFollow = async (userId: string): Promise<{
  following: boolean;
  is_following: boolean;
  followers_count: number;
  following_count: number;
}> => {
  try {
    return await apiFetch(`/users/${userId}/follow`, {
      method: 'POST',
    });
  } catch {
    // Local fallback
    const target = users.find(u => u.id === userId);
    const isNowFollowing = !target?.isFollowing;
    if (target) {
      target.isFollowing = isNowFollowing;
      target.followersCount = Math.max(0, (target.followersCount || 0) + (isNowFollowing ? 1 : -1));
    }
    return {
      following: isNowFollowing,
      is_following: isNowFollowing,
      followers_count: target?.followersCount || 0,
      following_count: target?.followingCount || 0,
    };
  }
};

export const getFollowers = async (userId: string): Promise<User[]> => {
  try {
    return await apiFetch<User[]>(`/users/${userId}/followers`);
  } catch {
    return [];
  }
};

export const getFollowing = async (userId: string): Promise<User[]> => {
  try {
    return await apiFetch<User[]>(`/users/${userId}/following`);
  } catch {
    return [];
  }
};
