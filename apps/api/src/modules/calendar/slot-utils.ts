import type { WeeklyAvailability } from '@veyrasend/db';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export interface SlotOption {
  startsAt: string;
  endsAt: string;
}

export function computeAvailableSlots(args: {
  availability: WeeklyAvailability;
  from: Date;
  to: Date;
  slotDurationMinutes: number;
  bufferMinutes: number;
  busy: Array<{ startsAt: Date; endsAt: Date }>;
}): SlotOption[] {
  const slots: SlotOption[] = [];
  const cursor = new Date(args.from);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= args.to) {
    const dayKey = DAY_KEYS[cursor.getUTCDay()]!;
    const windows = args.availability[dayKey] ?? [];
    for (const win of windows) {
      const startMin = parseTime(win.start);
      const endMin = parseTime(win.end);
      for (let m = startMin; m + args.slotDurationMinutes <= endMin; m += args.slotDurationMinutes + args.bufferMinutes) {
        const slotStart = new Date(cursor);
        slotStart.setUTCHours(Math.floor(m / 60), m % 60, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + args.slotDurationMinutes * 60_000);
        if (slotStart < args.from || slotStart > args.to) continue;
        const blocked = args.busy.some((b) => overlaps(slotStart, slotEnd, b.startsAt, b.endsAt));
        if (!blocked) {
          slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
        }
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return slots;
}

export function slugifyBooking(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
