import test from 'node:test';
import assert from 'node:assert/strict';
import { weekStart,inCalendarPeriod } from '../lib/calendar-period';
test('agenda agrupa domingo na semana anterior e preserva limites do mês',()=>{
  assert.equal(weekStart('2026-11-22T00:00:00Z'),'2026-11-16');
  assert.equal(weekStart('2026-11-23'),'2026-11-23');
  assert.equal(inCalendarPeriod('2026-11-22','2026-11-16','semana'),true);
  assert.equal(inCalendarPeriod('2026-11-23','2026-11-16','semana'),false);
  assert.equal(inCalendarPeriod('2026-12-01','2026-11-30','mes'),false);
  assert.equal(inCalendarPeriod('2026-11-16T00:00:00Z','2026-11-16','dia'),true);
  assert.equal(inCalendarPeriod('2025-01-01','2026-11-16','todos'),true);
});
