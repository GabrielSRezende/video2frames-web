import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../../core/services/video.service';
import { UploadProgressEvent } from '../../core/models/video.model';

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface UploadItem {
  file: File;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
}

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
  readonly items = signal<UploadItem[]>([]);
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly hasFiles = computed(() => this.items().length > 0);

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
    if (event.dataTransfer?.files) this.handleFiles(event.dataTransfer.files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.handleFiles(input.files);
    input.value = '';
  }

  private handleFiles(fileList: FileList): void {
    const files = Array.from(fileList);
    const valid = files.filter((f) => f.type.startsWith('video/'));
    const invalidCount = files.length - valid.length;

    if (invalidCount === files.length) {
      this.errorMessage.set('Envie apenas arquivos de vídeo válidos.');
    } else if (invalidCount > 0) {
      this.errorMessage.set(`${invalidCount} arquivo(s) ignorado(s) por não serem vídeos válidos.`);
    } else {
      this.errorMessage.set(null);
    }

    if (valid.length === 0) return;

    this.items.update((current) => [
      ...current,
      ...valid.map((file) => ({ file, progress: 0, status: 'pending' as UploadStatus })),
    ]);
  }

  removeItem(item: UploadItem): void {
    if (this.isUploading()) return;
    this.items.update((current) => current.filter((i) => i !== item));
  }

  clearSelection(): void {
    if (this.isUploading()) return;
    this.items.set([]);
    this.errorMessage.set(null);
  }

  // envia todos os pendentes em paralelo
  submitUpload(): void {
    const pending = this.items().filter((i) => i.status === 'pending');
    if (pending.length === 0 || this.isUploading()) return;

    this.isUploading.set(true);
    this.errorMessage.set(null);

    let remaining = pending.length;

    for (const item of pending) {
      this.updateItem(item, { status: 'uploading' });

      this.videoService.uploadVideo(item.file).subscribe({
        next: (event) => {
          if ('progress' in event) {
            this.updateItem(item, { progress: (event as UploadProgressEvent).progress });
          } else {
            this.updateItem(item, { status: 'done', progress: 100 });
          }
        },
        error: () => {
          this.updateItem(item, { status: 'error', errorMessage: 'Falha ao enviar' });
          remaining -= 1;
          this.checkAllSettled(remaining);
        },
        complete: () => {
          remaining -= 1;
          this.checkAllSettled(remaining);
        },
      });
    }
  }

  private checkAllSettled(remaining: number): void {
    if (remaining > 0) return;
    this.isUploading.set(false);

    if (this.items().some((i) => i.status === 'done')) {
      this.router.navigate(['/videos']);
    }
  }

  private updateItem(target: UploadItem, changes: Partial<UploadItem>): void {
    this.items.update((current) => current.map((i) => (i === target ? { ...i, ...changes } : i)));
  }
}
