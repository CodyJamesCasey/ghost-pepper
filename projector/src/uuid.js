const UUID_REGEX            = /[xy]/g;
const UUID_TEMPLATE         = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

/**
 * Generates a unique-ish UUID.
 * @return {String} the generated UUID string
 */
export function generate() {
  return UUID_TEMPLATE.replace(UUID_REGEX, c => {
    let r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
