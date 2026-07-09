import { MusicEvent } from '../types/event';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  EventDetail: { event: MusicEvent };
  Conversation: { chatId: string; otherUserId: string; otherUserName: string };
  EditProfile: undefined;
  UserProfile: { userId: string };
};

export type MainTabParamList = {
  EventsTab: undefined;
  ChatsTab: undefined;
  ProfileTab: undefined;
};
