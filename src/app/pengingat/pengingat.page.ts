import { Component, OnInit, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ReminderNotificationService } from '../services/reminder-notification.service';
import { ReminderItem, ReminderStoreService } from '../services/reminder-store.service';

@Component({
  selector: 'app-pengingat',
  templateUrl: './pengingat.page.html',
  styleUrls: ['./pengingat.page.scss'],
  standalone: false,
})
export class PengingatPage implements OnInit {
  private readonly reminderStore = inject(ReminderStoreService);
  private readonly reminderNotification = inject(ReminderNotificationService);
  private readonly toastController = inject(ToastController);

  reminders: ReminderItem[] = [];
  isAddModalOpen = false;
  todayKey = this.toDateKey(new Date());

  form = {
    title: '',
    time: '09:00',
    notes: '',
  };

  ngOnInit(): void {
    this.todayKey = this.toDateKey(new Date());
    this.reminders = this.reminderStore.getAll();
    this.syncNotifications();
  }

  ionViewWillEnter(): void {
    this.todayKey = this.toDateKey(new Date());
    this.reminders = this.reminderStore.getAll();
    this.syncNotifications();
  }

  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  get canSave(): boolean {
    return this.form.title.trim().length > 0;
  }

  trackByReminderId(_: number, reminder: ReminderItem): number {
    return reminder.id;
  }

  isReminderDone(reminder: ReminderItem): boolean {
    return this.reminderStore.isDone(reminder, this.todayKey);
  }

  isReminderOverdue(reminder: ReminderItem): boolean {
    return !this.isReminderDone(reminder) && reminder.time < this.currentTimeKey();
  }

  getStatusLabel(reminder: ReminderItem): string {
    if (this.isReminderDone(reminder)) {
      return 'Selesai';
    }

    if (this.isReminderOverdue(reminder)) {
      return 'Tertunda';
    }

    return 'Menunggu';
  }

  async saveReminder(): Promise<void> {
    const title = this.form.title.trim();

    if (!title) {
      return;
    }

    this.reminders = this.reminderStore.addReminder(this.reminders, {
      title,
      time: this.form.time,
      category: 'Pengingat',
      notes: this.form.notes,
      repeatDaily: true,
      flagged: false,
    });

    const saved = await this.persistRemindersAsync();
    
    if (!saved) {
      return;
    }

    this.form = {
      title: '',
      time: '09:00',
      notes: '',
    };
    this.closeAddModal();
    this.syncNotifications();
  }

  async toggleReminder(reminderId: number): Promise<void> {
    this.reminders = this.reminderStore.toggleDone(this.reminders, reminderId, this.todayKey);

    const saved = await this.persistRemindersAsync();

    if (!saved) {
      return;
    }

    this.syncNotifications();
  }

  async removeReminder(reminderId: number, event?: Event): Promise<void> {
    event?.stopPropagation();
    this.reminders = this.reminderStore.removeReminder(this.reminders, reminderId);

    const saved = await this.persistRemindersAsync();

    if (!saved) {
      return;
    }

    this.syncNotifications();
  }

  private async persistRemindersAsync(): Promise<boolean> {
    try {
      this.reminderStore.saveAll(this.reminders);
      return true;
    } catch (error) {
      console.error('Gagal menyimpan pengingat', error);
      const toast = await this.toastController.create({
        message: 'Penyimpanan gagal. Kemungkinan storage penuh. Hapus beberapa kegiatan lalu coba lagi.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
      return false;
    }
  }

  private currentTimeKey(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  private toDateKey(date: Date): string {
    return this.reminderStore.getTodayKey(date);
  }

  private syncNotifications(): void {
    void this.reminderNotification.syncReminders(this.reminders, this.todayKey).catch((error: unknown) => {
      console.error('Gagal sinkron notifikasi pengingat', error);
    });
  }
}
