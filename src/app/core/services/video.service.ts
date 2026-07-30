import {
  HttpClient,
  HttpEventType,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UploadProgressEvent, VideoItem } from '../models/video.model';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly http = inject(HttpClient);

  listVideos(): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${environment.videoApiUrl}/videos`);
  }

  /** Envia o vídeo e emite eventos de progresso (0-100) até a resposta final. */
  uploadVideo(file: File): Observable<UploadProgressEvent | VideoItem> {
    const formData = new FormData();
    formData.append('file', file);

    const request = new HttpRequest(
      'POST',
      `${environment.videoApiUrl}/videos`,
      formData,
      { reportProgress: true },
    );

    return this.http.request<VideoItem>(request).pipe(
      filter(
        (event) =>
          event.type === HttpEventType.UploadProgress ||
          event.type === HttpEventType.Response,
      ),
      map((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          return {
            fileName: file.name,
            progress: Math.round((event.loaded / event.total) * 100),
          } satisfies UploadProgressEvent;
        }
        return (event as { body: VideoItem }).body;
      }),
    );
  }

  downloadZip(videoId: string): Observable<Blob> {
    return this.http.get(`${environment.videoApiUrl}/videos/${videoId}/download`, {
      responseType: 'blob',
    });
  }
}
