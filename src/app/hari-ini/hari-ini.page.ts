import { Component, OnInit, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ReminderItem, ReminderStoreService } from '../services/reminder-store.service';

@Component({
  selector: 'app-hari-ini',
  templateUrl: './hari-ini.page.html',
  styleUrls: ['./hari-ini.page.scss'],
  standalone: false,
})
export class HariIniPage implements OnInit {
  private readonly reminderStore = inject(ReminderStoreService);
  private readonly toastController = inject(ToastController);

  reminders: ReminderItem[] = [];
  private todayKey = this.reminderStore.getTodayKey();

  get completedCount(): number {
    return this.reminders.filter((item) => this.reminderStore.isDone(item, this.todayKey)).length;
  }

  ngOnInit(): void {
    this.loadReminders();
  }

  ionViewWillEnter(): void {
    this.loadReminders();
  }

  async toggleDone(reminderId: number): Promise<void> {
    const allReminders = this.reminderStore.getAll();
    const updated = this.reminderStore.toggleDone(allReminders, reminderId, this.todayKey);
    
    const saved = await this.persistRemindersAsync(updated);
    
    if (!saved) {
      return;
    }
    
    this.loadReminders();
  }

  async removeReminder(reminderId: number): Promise<void> {
    const allReminders = this.reminderStore.getAll();
    const updated = this.reminderStore.removeReminder(allReminders, reminderId);
    
    const saved = await this.persistRemindersAsync(updated);
    
    if (!saved) {
      return;
    }
    
    this.loadReminders();
  }

  private async persistRemindersAsync(reminders: ReminderItem[]): Promise<boolean> {
    try {
      this.reminderStore.saveAll(reminders);
      return true;
    } catch (error) {
      console.error('Gagal menyimpan pengingat', error);
      const toast = await this.toastController.create({
        message: 'Penyimpanan gagal. Kemungkinan storage penuh.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
      return false;
    }
  }

  isDone(reminder: ReminderItem): boolean {
    return this.reminderStore.isDone(reminder, this.todayKey);
  }

  private loadReminders(): void {
    const allReminders = this.reminderStore.getAll();
    this.reminders = allReminders
      .filter((item) => item.repeatDaily || !item.doneDate)
      .sort((left, right) => left.time.localeCompare(right.time));
  }
}
