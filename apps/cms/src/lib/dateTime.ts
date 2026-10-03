function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** An ISO instant as the local date ("YYYY-MM-DD") and time ("HH:mm") the
 * date-time field edits. */
export function splitIso(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** The reverse: null until both parts are filled in and valid. */
export function combineToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const local = new Date(`${date}T${time}`);
  return Number.isNaN(local.getTime()) ? null : local.toISOString();
}
