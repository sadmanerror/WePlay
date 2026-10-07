import { ChatMessage } from '@/types';
import { mockMessages } from '../mocks/messages';
import { getUserById, currentMockUser } from '../mocks/users';
import { apiFetch } from './api-client';

const messages: ChatMessage[] = [...mockMessages];

export const getMessages = async (matchId: string): Promise<ChatMessage[]> => {
  try {
    return await apiFetch<ChatMessage[]>(`/matches/${matchId}/messages`);
  } catch {
    return messages.filter(m => m.matchId === matchId);
  }
};

export const sendMessage = async (matchId: string, userId: string, content: string): Promise<ChatMessage> => {
  try {
    return await apiFetch<ChatMessage>(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch {
    const user = getUserById(userId) || currentMockUser;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      matchId,
      userId,
      user,
      content,
      createdAt: new Date().toISOString(),
    };
    messages.push(newMessage);
    return newMessage;
  }
};
