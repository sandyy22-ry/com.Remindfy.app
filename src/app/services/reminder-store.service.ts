import { Injectable } from '@angular/core';

export interface ReminderItem {
  id: number;
  title: string;
  time: string;
  preAlertMinutes: number;
  category: string;
  notes: string;
  photoDataUrl: string | null;
  flagged: boolean;
  repeatDaily: boolean;
  doneDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReminderStoreService {
  private readonly storageKey = 'sandyapp.daily-reminders';

  getTodayKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getAll(): ReminderItem[] {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return this.seedStarterData();
    }

    try {
      const parsed = JSON.parse(rawValue) as ReminderItem[];

      if (!Array.isArray(parsed)) {
        return this.seedStarterData();
      }

      return parsed.map((item) => ({
        id: item.id,
        title: item.title ?? '',
        time: item.time ?? '08:00',
        preAlertMinutes: this.normalizePreAlertMinutes(item.preAlertMinutes),
        category: item.category ?? '',
        notes: item.notes ?? '',
        photoDataUrl: typeof item.photoDataUrl === 'string' ? item.photoDataUrl : null,
        flagged: Boolean(item.flagged),
        repeatDaily: item.repeatDaily !== false,
        doneDate: item.doneDate ?? null,
      }));
    } catch {
      return this.seedStarterData();
    }
  }

  saveAll(reminders: ReminderItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(reminders));
  }

  isDone(reminder: ReminderItem, todayKey = this.getTodayKey()): boolean {
    return reminder.repeatDaily ? reminder.doneDate === todayKey : Boolean(reminder.doneDate);
  }

  toggleDone(reminders: ReminderItem[], reminderId: number, todayKey = this.getTodayKey()): ReminderItem[] {
    return reminders.map((item) => {
      if (item.id !== reminderId) {
        return item;
      }

      if (item.repeatDaily) {
        return {
          ...item,
          doneDate: item.doneDate === todayKey ? null : todayKey,
        };
      }

      return {
        ...item,
        doneDate: item.doneDate ? null : todayKey,
      };
    });
  }

  removeReminder(reminders: ReminderItem[], reminderId: number): ReminderItem[] {
    return reminders.filter((item) => item.id !== reminderId);
  }

  addReminder(reminders: ReminderItem[], payload: {
    title: string;
    time: string;
    preAlertMinutes?: number;
    category: string;
    notes: string;
    photoDataUrl?: string | null;
    repeatDaily?: boolean;
    flagged?: boolean;
  }): ReminderItem[] {
    const title = payload.title.trim();

    if (!title || !payload.time) {
      return reminders;
    }

    const reminder: ReminderItem = {
      id: Date.now(),
      title,
      time: payload.time,
      preAlertMinutes: this.normalizePreAlertMinutes(payload.preAlertMinutes),
      category: payload.category.trim(),
      notes: payload.notes.trim(),
      photoDataUrl: payload.photoDataUrl?.trim() ? payload.photoDataUrl : null,
      flagged: Boolean(payload.flagged),
      repeatDaily: payload.repeatDaily !== false,
      doneDate: null,
    };

    return [reminder, ...reminders];
  }

  private seedStarterData(): ReminderItem[] {
    const baseId = Date.now();
    const starter: ReminderItem[] = [
      {
        id: baseId - 2,
        title: 'Minum air putih',
        time: '07:00',
        preAlertMinutes: 5,
        category: 'Kesehatan',
        notes: 'Awali hari dengan hidrasi yang cukup.',
        photoDataUrl: null,
        flagged: false,
        repeatDaily: true,
        doneDate: null,
      },
      {
        id: baseId - 1,
        title: 'Rencana kerja harian',
        time: '09:00',
        preAlertMinutes: 10,
        category: 'Pekerjaan',
        notes: 'Cek prioritas dan target utama hari ini.',
        photoDataUrl: null,
        flagged: true,
        repeatDaily: true,
        doneDate: null,
      },
      {
        id: baseId,
        title: 'Olahraga ringan',
        time: '18:30',
        preAlertMinutes: 15,
        category: 'Kesehatan',
        notes: 'Jalan kaki atau stretching singkat.',
        photoDataUrl: null,
        flagged: false,
        repeatDaily: true,
        doneDate: null,
      },
    ];

    this.saveAll(starter);
    return starter;
  }

  private normalizePreAlertMinutes(value: unknown): number {
    const allowedValues = [0, 5, 10, 15, 30, 60];
    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
      return 5;
    }

    return allowedValues.includes(parsed) ? parsed : 5;
  }
}
