export type CalendarView='dia'|'semana'|'mes'|'todos';
export function weekStart(value:string) {
  const day=new Date(`${value.slice(0,10)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
  return day.toISOString().slice(0,10);
}
export function inCalendarPeriod(date:string, anchor:string, view:CalendarView) {
  const day=date.slice(0,10);
  if(view==='todos')return true;
  if(view==='dia')return day===anchor;
  if(view==='mes')return day.slice(0,7)===anchor.slice(0,7);
  return weekStart(day)===weekStart(anchor);
}
