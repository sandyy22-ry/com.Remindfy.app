import { Component, OnInit, inject } from '@angular/core';
import { ReminderNotificationService } from './services/reminder-notification.service';
import { ReminderStoreService } from './services/reminder-store.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly reminderStore = inject(ReminderStoreService);
  private readonly reminderNotification = inject(ReminderNotificationService);


  ngOnInit(): void {
    const todayKey = this.reminderStore.getTodayKey(new Date());
    const reminders = this.reminderStore.getAll();

    void this.reminderNotification.syncReminders(reminders, todayKey).catch((error: unknown) => {
      console.error('Gagal sinkron notifikasi saat aplikasi dibuka', error);
    });
  }
}
