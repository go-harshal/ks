// Business-day helpers. "Today" is anchored to the business timezone (India, UTC+05:30, no DST)
// on the server so dashboards and reminders never depend on the viewer's browser clock.
const OFFSET = Number(process.env.BUSINESS_TZ_OFFSET_MIN || 330) * 60e3;
const DAY = 864e5;

const startOfDay = (t = Date.now()) => new Date(Math.floor((t + OFFSET) / DAY) * DAY - OFFSET);
const dayKey = (t = Date.now()) => new Date(new Date(t).getTime() + OFFSET).toISOString().slice(0, 10);
const parseDay = (ymd) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd || '') ? new Date(Date.parse(`${ymd}T00:00:00Z`) - OFFSET) : null);
const monthKey = (t) => dayKey(t).slice(0, 7);

module.exports = { DAY, OFFSET, startOfDay, dayKey, parseDay, monthKey };
