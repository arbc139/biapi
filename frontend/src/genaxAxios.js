import axios from 'axios';

const genax = axios.create({ baseURL: 'http://genax.tools:4000' });

export default genax;
