
const app = require('../app');

app.use('/search/papers', require('./papers'));
app.use('/search/patents', require('./patents'));