const yargs = require('yargs');

module.exports = yargs
  .option(
    'password',
    { default: '' },
  )
  .argv;
