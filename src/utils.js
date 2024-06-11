export function isURL(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}
