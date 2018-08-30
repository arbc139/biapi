
export function base64Encode(str) {
  return new Buffer(str).toString('base64');
}

export function base64Decode(str) {
  return new Buffer(str, 'base64').toString('utf-8');
}
