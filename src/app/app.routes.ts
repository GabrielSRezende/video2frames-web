import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { ShellComponent } from './shared/shell/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'upload', pathMatch: 'full' },
      {
        path: 'upload',
        loadComponent: () =>
          import('./features/upload/upload.component').then((m) => m.UploadComponent),
      },
      {
        path: 'videos',
        loadComponent: () =>
          import('./features/video-list/video-list.component').then(
            (m) => m.VideoListComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
