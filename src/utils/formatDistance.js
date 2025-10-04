// Lightweight relative time util (Vietnamese) without date-fns
const UNITS = [
  { s: 60, name: 'giây' },
  { s: 60, name: 'phút' },
  { s: 24, name: 'giờ' },
  { s: 30, name: 'ngày' },
  { s: 12, name: 'tháng' },
];

export function formatDistanceToNow(ts){
  const timeMs = (typeof ts === 'string') ? Date.parse(ts) : (typeof ts === 'number' ? ts : NaN);
  if(isNaN(timeMs)) return '';
  const diff = Math.floor((Date.now() - timeMs)/1000);
  if(diff < 5) return 'vừa xong';
  let value = diff; let unitIndex = 0;
  while(unitIndex < UNITS.length && value >= UNITS[unitIndex].s){
    value = Math.floor(value / UNITS[unitIndex].s);
    unitIndex++;
  }
  const names = ['giây','phút','giờ','ngày','tháng','năm'];
  const name = names[unitIndex];
  return `${value} ${name} trước`;
}
