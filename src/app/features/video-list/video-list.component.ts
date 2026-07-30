import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';
import { FilmstripProgressComponent } from '../../shared/filmstrip-progress/filmstrip-progress.component';
import { VideoService } from '../../core/services/video.service';
import { VideoItem } from '../../core/models/video.model';

const POLL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [FilmstripProgressComponent, DatePipe],
  templateUrl: './video-list.component.html',
  styleUrl: './video-list.component.css',
})
export class VideoListComponent implements OnInit {
  private readonly videoService = inject(VideoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly videos = signal<VideoItem[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.videoService.listVideos()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (videos) => {
          this.videos.set(videos);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  download(video: VideoItem): void {
    this.videoService.downloadZip(video.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${video.fileName.replace(/\.[^/.]+$/, '')}-frames.zip`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  statusLabel(status: VideoItem['status']): string {
    switch (status) {
      case 'UPLOADED':
        return 'Enviado';
      case 'PROCESSING':
        return 'Processando';
      case 'COMPLETED':
        return 'Concluído';
      case 'FAILED':
        return 'Erro';
    }
  }
}
