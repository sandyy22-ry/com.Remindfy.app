import { Component, Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-photo-viewer',
  templateUrl: './photo-viewer.component.html',
  styleUrls: ['./photo-viewer.component.scss'],
  standalone: false,
})
export class PhotoViewerComponent {
  private readonly modalController = inject(ModalController);

  @Input() photoDataUrl: string | null = null;
  @Input() title: string = '';

  async closeModal(): Promise<void> {
    await this.modalController.dismiss();
  }
}
