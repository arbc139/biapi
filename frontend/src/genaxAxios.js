import axios from 'axios';

const genax = axios.create({ baseURL: 'https://genax.tools:4440' });

export default genax;
