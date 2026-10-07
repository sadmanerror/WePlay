import { ChatMessage, User } from '@/types';
import { mockUsers, getUserById } from './users';

const defaultUser: User = mockUsers[0];

const rawMessages: { id: string; matchId: string; userId: string; content: string; createdAt: string }[] = [
  { id: 'msg1', matchId: 'm1', userId: 'u1', content: 'Anyone bringing a tape ball and extra bats?', createdAt: '2024-03-01T10:00:00Z' },
  { id: 'msg2', matchId: 'm1', userId: 'u2', content: 'I have 3 brand new tape balls, will bring them.', createdAt: '2024-03-01T10:05:00Z' },
  { id: 'msg3', matchId: 'm1', userId: 'u3', content: 'Great! See you all at Gulshan Park at 5.', createdAt: '2024-03-01T10:10:00Z' },
  { id: 'msg4', matchId: 'm1', userId: 'u1', content: "Let's wear light colored t-shirts if possible.", createdAt: '2024-03-01T10:15:00Z' },
  { id: 'msg5', matchId: 'm1', userId: 'u4', content: 'Sure thing, see you guys there.', createdAt: '2024-03-01T10:20:00Z' },
  { id: 'msg6', matchId: 'm1', userId: 'u5', content: 'I might be 10 mins late due to traffic, start the toss!', createdAt: '2024-03-01T14:30:00Z' },
  { id: 'msg7', matchId: 'm1', userId: 'u2', content: 'No worries Arman, we will warm up first.', createdAt: '2024-03-01T14:35:00Z' },
  { id: 'msg8', matchId: 'm1', userId: 'u1', content: 'Pitch is marked, looking great today 🏏', createdAt: '2024-03-01T16:50:00Z' },
  { id: 'msg9', matchId: 'm1', userId: 'u3', content: 'Just reached Gate 2 parking.', createdAt: '2024-03-01T16:55:00Z' },
  { id: 'msg10', matchId: 'm1', userId: 'u4', content: 'Walking in now!', createdAt: '2024-03-01T16:56:00Z' },

  { id: 'msg11', matchId: 'm2', userId: 'u3', content: 'Do we have 14 confirmed for 7v7 on the turf?', createdAt: '2024-03-02T11:00:00Z' },
  { id: 'msg12', matchId: 'm2', userId: 'u8', content: 'I can play goalkeeper for one side.', createdAt: '2024-03-02T11:05:00Z' },
  { id: 'msg13', matchId: 'm2', userId: 'u5', content: 'Perfect, Priya! I have the bibs ready (neon green & orange).', createdAt: '2024-03-02T11:15:00Z' },
  { id: 'msg14', matchId: 'm2', userId: 'u14', content: 'Does the turf require molded studs or flat soles?', createdAt: '2024-03-02T11:20:00Z' },
  { id: 'msg15', matchId: 'm2', userId: 'u3', content: 'Turf trainers or rubber studs only, no metal spikes.', createdAt: '2024-03-02T11:25:00Z' },
  { id: 'msg16', matchId: 'm2', userId: 'u11', content: 'Thanks Tanvir! Just paid my ৳200 court share.', createdAt: '2024-03-02T11:30:00Z' },
  { id: 'msg17', matchId: 'm2', userId: 'u1', content: 'Bringing two FIFA quality size-5 match balls.', createdAt: '2024-03-02T11:35:00Z' },
  { id: 'msg18', matchId: 'm2', userId: 'u4', content: 'Awesome, see everyone at 6pm sharp!', createdAt: '2024-03-02T11:40:00Z' },

  { id: 'msg21', matchId: 'm12', userId: 'u3', content: 'Futsal tonight at Badda Arena! 2 spots left to fill.', createdAt: '2024-03-03T09:00:00Z' },
  { id: 'msg22', matchId: 'm12', userId: 'u5', content: 'Fast-paced game, 10 min halves with rotation.', createdAt: '2024-03-03T09:10:00Z' },
  { id: 'msg23', matchId: 'm12', userId: 'u8', content: 'Are showers working at the facility?', createdAt: '2024-03-03T09:15:00Z' },
  { id: 'msg24', matchId: 'm12', userId: 'u3', content: 'Yes, full changing rooms and hot water.', createdAt: '2024-03-03T09:20:00Z' },
  { id: 'msg25', matchId: 'm12', userId: 'u14', content: 'Count me in for sure.', createdAt: '2024-03-03T09:25:00Z' },
  { id: 'msg26', matchId: 'm12', userId: 'u11', content: 'Will there be drinking water available?', createdAt: '2024-03-03T10:00:00Z' },
  { id: 'msg27', matchId: 'm12', userId: 'u3', content: 'Dispenser is there, bring your own bottles.', createdAt: '2024-03-03T10:05:00Z' },
];

export const mockMessages: ChatMessage[] = rawMessages.map(m => ({
  ...m,
  user: getUserById(m.userId) || defaultUser,
}));

export const getMessagesByMatchId = (matchId: string): ChatMessage[] => {
  return mockMessages.filter(m => m.matchId === matchId);
};
