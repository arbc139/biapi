
function encode(str) {
  return new Buffer(str).toString('base64');
}

function decode(str) {
  return new Buffer(str, 'base64').toString('utf-8');
}

module.exports = {
  encode,
  decode,
};
