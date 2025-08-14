export interface ChannelAnalytics {
  id: string;
  channelName: string;
  channelHandle: string;
  profileImageUrl: string;
  totalFollowers: number;
  hoursStreamed: number;
  totalStreams: number;
  averageViews: number;
  lastUpdatedAt: string | null;
  sources?: {
      uri: string;
      title: string;
  }[];
}

export interface VideoDetails {
  title: string;
  publishedAt: string;
  duration: string;
  views: number;
}