export function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ['https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function parseEventDate(value) {
  if (typeof value !== 'string') return null;
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/);
  if (!parts) return null;
  const [year, month, day, hour, minute, second] = parts.slice(1, 7).map((part) => Number(part || 0));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1] || hour > 23 || minute > 59 || second > 59) return null;
  const date = new Date(value);
  return Number.isFinite(+date) ? date : null;
}

export function eventDates(event) {
  const start = parseEventDate(event?.start);
  const end = parseEventDate(event?.end);
  if (!start || !end || end <= start) return null;
  return {start, end};
}

const escapeIcs = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// RFC 5545 folds long lines at 75 UTF-8 octets, without splitting a character.
function foldLine(line) {
  const encoder = new TextEncoder();
  let out = '', count = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (count + size > 75) { out += '\r\n '; count = 1; }
    out += char; count += size;
  }
  return out;
}

export function createCalendar(event, now = new Date()) {
  const dates = eventDates(event);
  if (!dates) return null;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cloud Nine//Graduation Invitation//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:graduation-${dates.start.getTime()}@cloud-nine.local`,
    `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(dates.start)}`, `DTEND:${stamp(dates.end)}`,
    `SUMMARY:${escapeIcs(event.name || 'Graduation celebration')}`,
    `LOCATION:${escapeIcs([event.venue, event.address].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${escapeIcs(event.description || 'A little celebration for a very big feeling.')}`,
    'END:VEVENT', 'END:VCALENDAR'
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
