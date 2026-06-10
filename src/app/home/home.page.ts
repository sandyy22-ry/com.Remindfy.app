import { Component, OnInit, inject } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ReminderNotificationService } from '../services/reminder-notification.service';
import { ReminderItem, ReminderStoreService } from '../services/reminder-store.service';
import { ReminderModalComponent } from './reminder-modal/reminder-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  private readonly reminderStore = inject(ReminderStoreService);
  private readonly reminderNotification = inject(ReminderNotificationService);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);

  reminders: ReminderItem[] = [];

  reminderForm = this.createEmptyForm();
  todayKey = this.toDateKey(new Date());

  totalCount = 0;
  todayCount = 0;
  scheduledCount = 0;
  flaggedCount = 0;
  completedCount = 0;

  ngOnInit(): void {
    this.todayKey = this.toDateKey(new Date());
    this.reminders = this.reminderStore.getAll();
    this.refreshDashboard();
    this.syncNotifications();
  }

  ionViewWillEnter(): void {
    this.todayKey = this.toDateKey(new Date());
    this.reminders = this.reminderStore.getAll();
    this.refreshDashboard();
    this.syncNotifications();
  }

  async openComposer(): Promise<void> {
    const modal = await this.modalController.create({
      component: ReminderModalComponent,
      componentProps: {
        reminderForm: this.createEmptyForm(),
      },
      breakpoints: [0, 0.5, 1],
      initialBreakpoint: 0.5,
      canDismiss: true,
      showBackdrop: true,
      presentingElement: await this.modalController.getTop(),
    });

    await modal.present();

    const result = await modal.onDidDismiss();

    if (result.data) {
      this.reminderForm = result.data;
      await this.addReminder();
    }
  }

  async addReminder(): Promise<void> {
    const title = this.reminderForm.title.trim();

    if (!title || !this.reminderForm.time) {
      return;
    }

    this.reminders = this.reminderStore.addReminder(this.reminders, {
      title,
      time: this.reminderForm.time,
      preAlertMinutes: this.reminderForm.preAlertMinutes,
      category: this.reminderForm.category,
      notes: this.reminderForm.notes,
      photoDataUrl: this.reminderForm.photoDataUrl,
      flagged: false,
      repeatDaily: this.reminderForm.repeatDaily,
    });
    this.reminderForm = this.createEmptyForm();

    const saved = await this.persistRemindersAsync();

    if (!saved) {
      return;
    }

    this.refreshDashboard();
    this.syncNotifications();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.reminderForm.photoDataUrl = null;
      input.value = '';
      this.showPhotoError('File harus berupa gambar (JPEG, PNG, GIF, dll)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.reminderForm.photoDataUrl = typeof reader.result === 'string' ? reader.result : null;
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

  clearSelectedPhoto(fileInput: HTMLInputElement): void {
    this.reminderForm.photoDataUrl = null;
    fileInput.value = '';
  }

  async triggerTestNotification(): Promise<void> {
    try {
      const scheduled = await this.reminderNotification.sendDebugNotification(10);

      if (!scheduled) {
        const toast = await this.toastController.create({
          message: 'Izin notifikasi belum aktif. Izinkan notifikasi untuk Remindfy di pengaturan aplikasi.',
          duration: 3000,
          position: 'bottom',
          color: 'warning',
        });
        await toast.present();
        return;
      }

      const toast = await this.toastController.create({
        message: 'Notifikasi tes dijadwalkan 10 detik dari sekarang.',
        duration: 3000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
    } catch (error) {
      console.error('Gagal menjadwalkan notifikasi tes', error);
      const toast = await this.toastController.create({
        message: 'Gagal menjadwalkan notifikasi tes. Coba lagi setelah aplikasi dibuka ulang.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    }
  }

  private refreshDashboard(): void {
    const sortedReminders = [...this.reminders].sort((left, right) => left.time.localeCompare(right.time));
    const currentTime = this.currentTimeKey();

    this.totalCount = sortedReminders.length;
    this.completedCount = sortedReminders.filter((item) => this.reminderStore.isDone(item, this.todayKey)).length;
    this.todayCount = sortedReminders.filter((item) => !this.reminderStore.isDone(item, this.todayKey)).length;
    this.scheduledCount = sortedReminders.filter(
      (item) => !this.reminderStore.isDone(item, this.todayKey) && item.time >= currentTime,
    ).length;
    this.flaggedCount = sortedReminders.filter((item) => item.flagged).length;
  }

  private createEmptyForm(): {
    title: string;
    time: string;
    category: string;
    notes: string;
    photoDataUrl: string | null;
    repeatDaily: boolean;
    preAlertMinutes: number;
  } {
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

  private currentTimeKey(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }



  private syncNotifications(): void {
    void this.reminderNotification.syncReminders(this.reminders, this.todayKey).catch((error: unknown) => {
      console.error('Gagal sinkron notifikasi pengingat', error);
    });
  }

  private async persistRemindersAsync(): Promise<boolean> {
    try {
      this.reminderStore.saveAll(this.reminders);
      return true;
    } catch (error) {
      console.error('Gagal menyimpan pengingat', error);
      const toast = await this.toastController.create({
        message: 'Penyimpanan gagal. Kemungkinan storage penuh. Hapus beberapa kegiatan dengan foto besar lalu coba lagi.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
      return false;
    }
  }

  private toDateKey(date: Date): string {
    return this.reminderStore.getTodayKey(date);
  }

}
