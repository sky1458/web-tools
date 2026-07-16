import { defineConfig } from 'umi';
import routes from './routes';

export default defineConfig({
  base: '/',
  publicPath: '/web-tools/',
  history: { type: 'hash' },
  routes,
  npmClient: 'yarn',
  utoopack: {},
});
