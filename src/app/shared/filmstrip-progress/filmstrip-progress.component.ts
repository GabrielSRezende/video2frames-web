import { Component, computed, input } from '@angular/core';
import { VideoStatus } from '../../core/models/video.model';

const STAGE_ORDER: VideoStatus[] = ['UPLOADED', 'PROCESSING', 'COMPLETED'];
const FRAME_COUNT = 5;

@Component({
  selector: 'app-filmstrip-progress',
  standalone: true,
  templateUrl: './filmstrip-progress.component.html',
  styleUrl: './filmstrip-progress.component.css',
})
export class FilmstripProgressComponent {
  readonly status = input.required<VideoStatus>();

  readonly frames = computed(() => Array.from({ length: FRAME_COUNT }));

  readonly litCount = computed(() => {
    const current = this.status();
    if (current === 'FAILED') return FRAME_COUNT;
    if (current === 'COMPLETED') return FRAME_COUNT;
    const stageIndex = STAGE_ORDER.indexOf(current);
    // UPLOADED acende 1 quadro, PROCESSING acende progressivamente até o penúltimo
    return stageIndex <= 0 ? 1 : FRAME_COUNT - 1;
  });

  readonly isProcessing = computed(() => this.status() === 'PROCESSING');
  readonly isFailed = computed(() => this.status() === 'FAILED');
}
