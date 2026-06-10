import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type LocalNotificationSchema,
  type NotificationChannel,
} from '@capacitor/local-notifications';
import { ReminderItem, ReminderStoreService } from './reminder-store.service';

@Injectable({
  providedIn: 'root',
})
export class ReminderNotificationService {
  private readonly reminderStore = inject(ReminderStoreService);

  private readonly channelId = 'sandyapp-reminder-alerts';
  private readonly defaultPreAlertMinutes = 5;
  private readonly permissionPromptCooldownMs = 60 * 1000;
  private readonly lastPermissionPromptKey = 'remindfy.notifications.last-permission-prompt';
  private initialized = false;
  private readonly maxNotificationId = 2147483647;
  private syncQueue: Promise<void> = Promise.resolve();

  async syncReminders(
    reminders: ReminderItem[],
    todayKey = this.reminderStore.getTodayKey(),
    options?: { interactive?: boolean },
  ): Promise<void> {
    this.syncQueue = this.syncQueue
      .catch(() => undefined)
      .then(() => this.performSyncReminders(reminders, todayKey, options));

    return this.syncQueue;
  }

  async sendDebugNotification(delaySeconds = 10): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Notifikasi lokal hanya berjalan di build native Android/iOS, bukan di browser.');
      return false;
    }

    const initialized = await this.initialize({
      requestPermission: true,
      allowOpenExactAlarmSettings: true,
    });

    if (!initialized) {
      return false;
    }

    const trigger = new Date(Date.now() + Math.max(3, delaySeconds) * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: this.toNotificationId(Date.now()),
          title: 'Tes Notifikasi Remindfy',
          body: 'Jika notifikasi ini muncul, sistem notifikasi sudah aktif.',
          channelId: this.channelId,
          sound: 'default',
          schedule: {
            at: trigger,
            allowWhileIdle: true,
          },
        },
      ],
    });

    return true;
  }

  private async performSyncReminders(
    reminders: ReminderItem[],
    todayKey: string,
    options?: { interactive?: boolean },
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Sinkron notifikasi dilewati karena aplikasi berjalan di browser.');
      return;
    }

    const isInteractive = options?.interactive === true;

    const initialized = await this.initialize({
      requestPermission: isInteractive,
      allowOpenExactAlarmSettings: isInteractive,
    });

    if (!initialized) {
      return;
    }

    const pending = await LocalNotifications.getPending();
    const notificationIds = pending.notifications.map((item) => ({ id: item.id }));

    if (notificationIds.length > 0) {
      await LocalNotifications.cancel({ notifications: notificationIds });
    }

    const pendingReminders = reminders.filter((item) => !this.reminderStore.isDone(item, todayKey));
    const notifications = pendingReminders.reduce<LocalNotificationSchema[]>((result, item) => {
      result.push(...this.toNotifications(item));
      return result;
    }, []);

    if (notifications.length === 0) {
      console.warn('Tidak ada notifikasi yang bisa dijadwalkan. Periksa jam pengingat dan status selesai.');
      return;
    }

    let scheduledCount = 0;

    for (const notification of notifications) {
      try {
        await LocalNotifications.schedule({ notifications: [notification] });
        scheduledCount += 1;
      } catch (error) {
        console.warn(`Gagal menjadwalkan notifikasi id=${notification.id}. Notifikasi lain tetap dilanjutkan.`, error);
      }
    }

    if (scheduledCount === 0) {
      console.warn('Semua notifikasi gagal dijadwalkan. Periksa izin notifikasi dan jam pengingat.');
    }
  }

  private async initialize(options?: {
    requestPermission?: boolean;
    allowOpenExactAlarmSettings?: boolean;
  }): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    const requestPermission = options?.requestPermission ?? true;
    const allowOpenExactAlarmSettings = options?.allowOpenExactAlarmSettings ?? true;

    const permission = await LocalNotifications.checkPermissions();

    if (permission.display !== 'granted') {
      if (!requestPermission) {
        return false;
      }

      const requested = await LocalNotifications.requestPermissions();

      if (requested.display !== 'granted') {
        return false;
      }

      this.recordPermissionPromptTime();
    }

    const exactAlarmAllowed = await this.ensureExactAlarmPermission(allowOpenExactAlarmSettings);

    if (!exactAlarmAllowed) {
      return false;
    }

    await this.ensureAndroidChannel();
    this.initialized = true;
    return true;
  }

  private async ensureExactAlarmPermission(allowOpenSettings = true): Promise<boolean> {
    if (Capacitor.getPlatform() !== 'android') {
      return true;
    }

    const localNotificationsApi = LocalNotifications as unknown as {
      checkExactNotificationSetting?: () => Promise<{ value: boolean }>;
      changeExactNotificationSetting?: () => Promise<void>;
    };

    if (!localNotificationsApi.checkExactNotificationSetting) {
      return true;
    }

    const setting = await localNotificationsApi.checkExactNotificationSetting();

    if (setting.value) {
      return true;
    }

    if (!allowOpenSettings) {
      console.warn('Izin exact alarm belum aktif. Notifikasi tetap dijadwalkan dengan mode kompatibel perangkat.');
      return true;
    }

    console.warn('Izin exact alarm belum aktif. Membuka pengaturan Android untuk mengaktifkan izin.');
    await localNotificationsApi.changeExactNotificationSetting?.();

    const recheck = await localNotificationsApi.checkExactNotificationSetting();

    if (!recheck.value) {
      console.warn('Exact alarm belum diaktifkan. Notifikasi tetap dijadwalkan dengan mode kompatibel perangkat.');
    }

    return true;
  }

  private async ensureAndroidChannel(): Promise<void> {
    const channel: NotificationChannel = {
      id: this.channelId,
      name: 'Pengingat Aktivitas',
      description: 'Notifikasi pengingat harian Remindfy',
      importance: 5,
      visibility: 1,
      sound: 'default',
    };

    await LocalNotifications.createChannel(channel);
  }

  private toNotifications(reminder: ReminderItem): LocalNotificationSchema[] {
    const parsedTime = this.parseReminderTime(reminder.time);

    if (!parsedTime) {
      console.warn(`Waktu pengingat tidak valid untuk reminderId=${reminder.id}: ${reminder.time}`);
      return [];
    }

    const { hour, minute } = parsedTime;
    const preAlertMinutes = this.normalizePreAlertMinutes(reminder.preAlertMinutes);
    const preAlertTime = this.offsetTime(hour, minute, -preAlertMinutes);

    const mainNotification: LocalNotificationSchema = {
      id: this.toReminderNotificationId(reminder.id, 'main'),
      title: 'Pengingat Aktivitas',
      body: reminder.title,
      channelId: this.channelId,
      sound: 'default',
      actionTypeId: '',
      schedule: reminder.repeatDaily
        ? {
            on: {
              hour,
              minute,
            },
            repeats: true,
            allowWhileIdle: true,
          }
        : {
            at: this.nextTriggerDate(hour, minute),
            allowWhileIdle: true,
          },
      extra: {
        reminderId: reminder.id,
        kind: 'main',
      },
    };

    if (preAlertMinutes <= 0) {
      return [mainNotification];
    }

    const preAlertNotification: LocalNotificationSchema = {
      id: this.toReminderNotificationId(reminder.id, 'pre'),
      title: 'Pengingat Awal',
      body: `${reminder.title} dimulai ${preAlertMinutes} menit lagi.`,
      channelId: this.channelId,
      sound: 'default',
      actionTypeId: '',
      schedule: reminder.repeatDaily
        ? {
            on: {
              hour: preAlertTime.hour,
              minute: preAlertTime.minute,
            },
            repeats: true,
            allowWhileIdle: true,
          }
        : {
            at: this.nextTriggerDate(preAlertTime.hour, preAlertTime.minute),
            allowWhileIdle: true,
          },
      extra: {
        reminderId: reminder.id,
        kind: 'pre',
      },
    };

    return [preAlertNotification, mainNotification];
  }

  private toReminderNotificationId(reminderId: number, kind: 'main' | 'pre'): number {
    const suffix = kind === 'main' ? 1 : 2;
    return this.toNotificationId(reminderId * 10 + suffix);
  }

  private toNotificationId(reminderId: number): number {
    // LocalNotifications on Android expects a signed 32-bit integer ID.
    const normalized = Math.abs(Math.trunc(reminderId));
    return (normalized % (this.maxNotificationId - 1)) + 1;
  }

  private nextTriggerDate(hour: number, minute: number): Date {
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    if (triggerDate.getTime() <= Date.now()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    return triggerDate;
  }

  private offsetTime(hour: number, minute: number, offsetMinutes: number): { hour: number; minute: number } {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    date.setMinutes(date.getMinutes() + offsetMinutes);

    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }

  private normalizePreAlertMinutes(value: unknown): number {
    const allowedValues = [0, 5, 10, 15, 30, 60];
    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
      return this.defaultPreAlertMinutes;
    }

    return allowedValues.includes(parsed) ? parsed : this.defaultPreAlertMinutes;
  }

  private shouldPromptPermissionNow(): boolean {
    const rawValue = localStorage.getItem(this.lastPermissionPromptKey);
    const lastPromptTime = Number(rawValue);

    if (!Number.isFinite(lastPromptTime)) {
      return true;
    }

    return Date.now() - lastPromptTime >= this.permissionPromptCooldownMs;
  }

  private recordPermissionPromptTime(): void {
    localStorage.setItem(this.lastPermissionPromptKey, String(Date.now()));
  }

  private parseReminderTime(timeValue: string): { hour: number; minute: number } | null {
    if (!timeValue || !timeValue.includes(':')) {
      return null;
    }

    const [hourText, minuteText] = timeValue.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
      return null;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return { hour, minute };
  }
}
