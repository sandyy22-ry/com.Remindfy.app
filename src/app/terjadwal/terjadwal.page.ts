import { Component, OnInit, inject } from '@angular/core';
import { ReminderItem, ReminderStoreService } from '../services/reminder-store.service';

interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasItems: boolean;
}

@Component({
  selector: 'app-terjadwal',
  templateUrl: './terjadwal.page.html',
  styleUrls: ['./terjadwal.page.scss'],
  standalone: false,
})
export class TerjadwalPage implements OnInit {
  private readonly reminderStore = inject(ReminderStoreService);

  readonly weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  currentMonth = new Date();
  selectedDate = new Date();
  monthLabel = '';
  selectedDateLabel = '';
  selectedDateItems: ReminderItem[] = [];
  calendarDays: CalendarDay[] = [];

  private reminders: ReminderItem[] = [];
  private todayKey = '';

  ngOnInit(): void {
    this.initializeState();
  }

  ionViewWillEnter(): void {
    this.initializeState();
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.refreshCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.refreshCalendar();
  }

  goToToday(): void {
    this.currentMonth = new Date();
    this.selectedDate = new Date();
    this.refreshCalendar();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate = new Date(day.date);
    this.refreshCalendar();
  }

  trackByDateKey(_: number, day: CalendarDay): string {
    return day.dateKey;
  }

  private initializeState(): void {
    this.reminders = this.reminderStore.getAll();
    this.todayKey = this.reminderStore.getTodayKey(new Date());

    this.currentMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    this.refreshCalendar();
  }

  private refreshCalendar(): void {
    this.monthLabel = this.toTitleCase(
      new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
      }).format(this.currentMonth),
    );

    this.selectedDateLabel = this.toTitleCase(
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(this.selectedDate),
    );

    this.calendarDays = this.buildCalendarGrid(this.currentMonth);
    this.selectedDateItems = [...this.reminders]
      .filter((item) => item.repeatDaily || !item.doneDate)
      .sort((left, right) => left.time.localeCompare(right.time));
  }

  private buildCalendarGrid(referenceMonth: Date): CalendarDay[] {
    const days: CalendarDay[] = [];
    const year = referenceMonth.getFullYear();
    const month = referenceMonth.getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const startOffset = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);

      const dateKey = this.reminderStore.getTodayKey(date);
      const isCurrentMonth = date >= monthStart && date <= monthEnd;

      days.push({
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday: dateKey === this.todayKey,
        isSelected: dateKey === this.reminderStore.getTodayKey(this.selectedDate),
        hasItems: this.reminders.length > 0,
      });
    }

    return days;
  }

  isItemDone(item: ReminderItem): boolean {
    const selectedKey = this.reminderStore.getTodayKey(this.selectedDate);
    return this.reminderStore.isDone(item, selectedKey);
  }

  private toTitleCase(value: string): string {
    if (!value) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
