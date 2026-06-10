import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

interface ReminderForm {
  title: string;
  time: string;
  category: string;
  notes: string;
  photoDataUrl: string | null;
  repeatDaily: boolean;
  preAlertMinutes: number;
}

@Component({
  selector: 'app-reminder-modal',
  templateUrl: './reminder-modal.component.html',
  styleUrls: ['./reminder-modal.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReminderModalComponent implements OnInit, AfterViewInit {
  private readonly modalController = inject(ModalController);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly toastController = inject(ToastController);

  @Input() reminderForm!: ReminderForm;
  @ViewChild('reminderTitleInput', { static: false }) reminderTitleInput?: ElementRef<HTMLInputElement>;
  private readonly focusDelayMs = 300;

  // Add minutes to time (HH:MM) in reminderForm
  addMinutes(deltaMinutes: number): void {
    if (!this.reminderForm || !this.reminderForm.time) {
      this.reminderForm = this.createEmptyForm();
    }

    const time = this.reminderForm.time as string; // expected format 'HH:MM'
    const parts = time.split(':');
    if (parts.length !== 2) {
      return;
    }

    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (isNaN(hour) || isNaN(minute)) {
      return;
    }

    const total = (hour * 60 + minute + deltaMinutes) % (24 * 60);
    const newHour = Math.floor(total / 60);
    const newMinute = total % 60;
    const hh = String(newHour).padStart(2, '0');
    const mm = String(newMinute).padStart(2, '0');
    this.reminderForm.time = `${hh}:${mm}`;
    this.cd?.markForCheck?.();
  }

  ngOnInit(): void {
    if (!this.reminderForm) {
      this.reminderForm = this.createEmptyForm();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.reminderTitleInput?.nativeElement?.focus();
    }, this.focusDelayMs);
  }

  async handleSubmit(): Promise<void> {
    const title = this.reminderForm.title?.trim() || '';

    if (!title) {
      const toast = await this.toastController.create({
        message: 'Judul kegiatan harus diisi',
        duration: 2000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    if (!this.reminderForm.time) {
      const toast = await this.toastController.create({
        message: 'Waktu harus diisi',
        duration: 2000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    await this.modalController.dismiss(this.reminderForm);
  }

  async closeModal(): Promise<void> {
    await this.modalController.dismiss(null);
  }

  private createEmptyForm(): ReminderForm {
    return {
      title: '',
      time: '08:00',
      category: '',
      notes: '',
      photoDataUrl: null,
      repeatDaily: true,
      preAlertMinutes: 5,
    };
  }
}
