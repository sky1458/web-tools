import { defineConfig } from 'umi';

export default defineConfig({
  base: '/',
  publicPath: '/web-tools/',
  history: { type: 'hash' },
  routes: [
    { path: '/', component: 'qrcode' },
    { path: '/lottery', component: 'lottery' },
    { path: '/docs', component: 'docs' },
  ],
  npmClient: 'yarn',
  utoopack: {},
});
