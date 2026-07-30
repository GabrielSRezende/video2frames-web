export type VideoStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface VideoItem {
  id: string;
  fileName: string;
  status: VideoStatus;
  createdAt: string;
  frameCount?: number;
  errorReason?: string;
}

export interface UploadProgressEvent {
  fileName: string;
  progress: number; // 0-100
}
