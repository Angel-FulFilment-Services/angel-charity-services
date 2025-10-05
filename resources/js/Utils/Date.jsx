export function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th'; // covers 11th to 19th
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function toMidnight(date) {
  const d = new Date(date);
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return new Date(); // Return current date if invalid
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isValidRange(start, end, min, max) {
  const s = toMidnight(start);
  const e = toMidnight(end);
  const minD = min ? toMidnight(min) : null;
  const maxD = max ? toMidnight(max) : null;

  if (minD && e < minD) return false;
  if (maxD && s > maxD) return false;

  const cs = clampDate(s, minD, maxD);
  const ce = clampDate(e, minD, maxD);
  if (cs > ce) return false;

  return true;
}

function clampDate(date, min, max) {
  const d = toMidnight(date);
  if (min && d < toMidnight(min)) return toMidnight(min);
  if (max && d > toMidnight(max)) return toMidnight(max);
  return d;
}