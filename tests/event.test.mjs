import test from 'node:test';
import assert from 'node:assert/strict';

let lib;
try { lib = await import('../dist/event.mjs'); } catch { lib = {}; }

test('a calendar is unavailable until both real dates are configured', () => {
  assert.equal(typeof lib.createCalendar, 'function');
  assert.equal(lib.createCalendar({ name: 'My graduation', start: '', end: '' }), null);
  assert.equal(lib.createCalendar({ start: 'not a date', end: '2027-06-01T13:00:00+07:00' }), null);
  assert.equal(lib.createCalendar({ start: '2027-06-01T14:00:00+07:00', end: '2027-06-01T13:00:00+07:00' }), null);
});

test('calendar respects explicit offsets and escapes user text', () => {
  assert.equal(typeof lib.createCalendar, 'function');
  const result = lib.createCalendar({
    name: 'Mai, An; graduation', start: '2027-06-01T10:00:00+07:00',
    end: '2027-06-01T12:00:00+07:00', venue: 'Garden\nsecond floor',
    description: 'Cake \\ photos',
  }, new Date('2026-11-21T06:00:00Z'));
  assert.match(result, /DTSTART:20270601T030000Z/);
  assert.match(result, /DTEND:20270601T050000Z/);
  assert.match(result, /SUMMARY:Mai\\, An\\; graduation/);
  assert.match(result, /LOCATION:Garden\\nsecond floor/);
  assert.ok(result.endsWith('END:VCALENDAR\r\n'));
});

test('external links accept HTTPS and mail but reject executable schemes', () => {
  assert.equal(typeof lib.safeUrl, 'function');
  assert.equal(lib.safeUrl('https://example.com/rsvp'), 'https://example.com/rsvp');
  assert.equal(lib.safeUrl('mailto:hello@example.com'), 'mailto:hello@example.com');
  assert.equal(lib.safeUrl('javascript:alert(1)'), null);
  assert.equal(lib.safeUrl('data:text/html,unsafe'), null);
  assert.equal(lib.safeUrl(''), null);
});

test('calendar rejects impossible dates rather than moving them into another month', () => {
  for (const day of ['2027-02-29', '2027-02-30', '2028-04-31']) {
    assert.equal(lib.eventDates({start: `${day}T10:00:00+07:00`, end: `${day}T12:00:00+07:00`}), null);
  }
  assert.equal(lib.eventDates({start: '2028-02-29T24:00:00Z', end: '2028-03-01T02:00:00Z'}), null);
  assert.ok(lib.eventDates({start: '2028-02-29T10:00:00+07:00', end: '2028-02-29T12:00:00+07:00'}));
});
