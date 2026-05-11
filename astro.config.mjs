import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://wjdwhddls.github.io',
  base: '/my-portfolio',
  trailingSlash: 'ignore',
  integrations: [
    tailwind({
      // global.css에서 @tailwind 지시문을 직접 import하므로 base 자동 주입 비활성
      applyBaseStyles: false,
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
