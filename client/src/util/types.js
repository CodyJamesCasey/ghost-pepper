export function strcmp(a, b) {
  a = a.toString(), b = b.toString();
  for (var i=0,n=Math.max(a.length, b.length); i<n && a.charAt(i) === b.charAt(i); ++i);
  if (i === n) return 0;
  return a.charAt(i) > b.charAt(i) ? -1 : 1;
}

export function stringPropertyComparator(key, asc, a, b) {
  let aVal = a[key];
  let bVal = b[key];

  if (asc) {
    return strcmp(bVal, aVal);
  } else {
    return strcmp(aVal, bVal);
  }
}

export function numberPropertyComparator(key, asc, a, b) {
  let aVal = a[key];
  let bVal = b[key];

  if (asc) {
    return (aVal - bVal);
  } else {
    return (bVal - aVal);
  }
}