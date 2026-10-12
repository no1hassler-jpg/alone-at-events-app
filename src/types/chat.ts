export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: number;
  createdAt: number;
  eventId?: string;
  eventName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}
