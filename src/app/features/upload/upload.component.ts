import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../../core/services/video.service';
import { UploadProgressEvent } from '../../core/models/video.model';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
})
export class UploadComponent {
  private readonly videoService = inject(VideoService);
  private readonly router = inject(Router);

  readonly isDragging = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly progress = signal(0);
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('video/')) {
      this.errorMessage.set('Envie um arquivo de vídeo válido.');
      return;
    }
    this.errorMessage.set(null);
    this.selectedFile.set(file);
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.progress.set(0);
  }

  submitUpload(): void {
    const file = this.selectedFile();
    if (!file || this.isUploading()) return;

    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.videoService.uploadVideo(file).subscribe({
      next: (event) => {
        if ('progress' in event) {
          this.progress.set((event as UploadProgressEvent).progress);
        } else {
          this.onUploadComplete();
        }
      },
      error: () => {
        this.isUploading.set(false);
        this.errorMessage.set('Falha ao enviar o vídeo. Tente novamente.');
      },
    });
  }

  private onUploadComplete(): void {
    this.isUploading.set(false);
    this.router.navigate(['/videos']);
  }
}
