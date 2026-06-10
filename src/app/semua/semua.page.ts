import { Component, OnInit, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ReminderItem, ReminderStoreService } from '../services/reminder-store.service';

@Component({
  selector: 'app-semua',
  templateUrl: './semua.page.html',
  styleUrls: ['./semua.page.scss'],
  standalone: false,
})
export class SemuaPage implements OnInit {
  private readonly reminderStore = inject(ReminderStoreService);
  private readonly toastController = inject(ToastController);

  reminders: ReminderItem[] = [];

  form = {
    title: '',
    notes: '',
    time: '09:00',
  };

  get totalCount(): number {
    return this.reminders.length;
  }

  ngOnInit(): void {
    this.reminders = this.reminderStore.getAll();
  }

  ionViewWillEnter(): void {
    this.reminders = this.reminderStore.getAll();
  }

  async addFromSemua(): Promise<void> {
    this.reminders = this.reminderStore.addReminder(this.reminders, {
      title: this.form.title,
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
      notes: '',
      time: '09:00',
    };
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
}
