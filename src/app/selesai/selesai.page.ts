import { Component, OnInit, inject } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ReminderNotificationService } from '../services/reminder-notification.service';
import { ReminderItem, ReminderStoreService } from '../services/reminder-store.service';
import { PhotoViewerComponent } from './photo-viewer/photo-viewer.component';

@Component({
  selector: 'app-selesai',
  templateUrl: './selesai.page.html',
  styleUrls: ['./selesai.page.scss'],
  standalone: false,
})
export class SelesaiPage implements OnInit {
  private readonly reminderStore = inject(ReminderStoreService);
  private readonly reminderNotification = inject(ReminderNotificationService);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);

  reminders: ReminderItem[] = [];
  completedReminders: ReminderItem[] = [];
  todayKey = this.reminderStore.getTodayKey(new Date());

  get completedCount(): number {
    return this.completedReminders.length;
  }

  ngOnInit(): void {
    this.reminders = this.reminderStore.getAll();
    this.refreshCompleted();
  }

  ionViewWillEnter(): void {
    this.reminders = this.reminderStore.getAll();
    this.refreshCompleted();
  }

  clearCompleted(): void {
    this.reminders = this.reminders.filter((item) => !this.isReminderDone(item));
    this.reminderStore.saveAll(this.reminders);
    this.refreshCompleted();
    this.syncNotifications();
  }

  removeCompletedReminder(reminderId: number): void {
    this.reminders = this.reminderStore.removeReminder(this.reminders, reminderId);
    this.reminderStore.saveAll(this.reminders);
    this.refreshCompleted();
    this.syncNotifications();
  }

  onCompletedPhotoSelected(reminderId: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.showPhotoError('File harus berupa gambar (JPEG, PNG, GIF, dll)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const photoDataUrl = typeof reader.result === 'string' ? reader.result : null;
      this.updateReminderPhoto(reminderId, photoDataUrl);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  private async showPhotoError(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'warning',
    });
    await toast.present();
  }

  clearCompletedPhoto(reminderId: number): void {
    this.updateReminderPhoto(reminderId, null);
  }

  async viewPhoto(photoDataUrl: string, title: string): Promise<void> {
    const modal = await this.modalController.create({
      component: PhotoViewerComponent,
      componentProps: {
        photoDataUrl,
        title,
      },
      showBackdrop: true,
    });

    await modal.present();
  }

  private refreshCompleted(): void {
    this.completedReminders = this.reminders.filter((item) => this.isReminderDone(item));
  }

  private updateReminderPhoto(reminderId: number, photoDataUrl: string | null): void {
    this.reminders = this.reminders.map((item) => {
      if (item.id !== reminderId) {
        return item;
      }

      return {
        ...item,
        photoDataUrl,
      };
    });

    this.reminderStore.saveAll(this.reminders);
    this.refreshCompleted();
  }

  private isReminderDone(reminder: ReminderItem): boolean {
    return this.reminderStore.isDone(reminder, this.todayKey);
  }

  private syncNotifications(): void {
    void this.reminderNotification.syncReminders(this.reminders, this.todayKey).catch((error: unknown) => {
      console.error('Gagal sinkron notifikasi pengingat selesai', error);
    });
  }
}
