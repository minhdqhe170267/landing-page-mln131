import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                timeline: resolve(__dirname, 'timeline.html'),
                mosaic: resolve(__dirname, 'mosaic.html'),
                students: resolve(__dirname, 'fpt-students.html'),
                about: resolve(__dirname, 'about.html'),
                religionBuddhism: resolve(__dirname, 'religion-buddhism.html'),
                religionCatholicism: resolve(__dirname, 'religion-catholicism.html'),
                religionProtestantism: resolve(__dirname, 'religion-protestantism.html'),
                religionIslam: resolve(__dirname, 'religion-islam.html'),
                religionCaodaism: resolve(__dirname, 'religion-caodaism.html'),
                religionHoahao: resolve(__dirname, 'religion-hoahao.html'),
                religionFolk: resolve(__dirname, 'religion-folk.html'),
                religionNone: resolve(__dirname, 'religion-none.html'),
                religionDetail: resolve(__dirname, 'religion-detail.html'),
                buddhismPeriod1: resolve(__dirname, 'buddhism-period-1.html'),
                buddhismPeriod2: resolve(__dirname, 'buddhism-period-2.html'),
                buddhismPeriod3: resolve(__dirname, 'buddhism-period-3.html'),
                buddhismPeriod4: resolve(__dirname, 'buddhism-period-4.html'),
                buddhismPeriod5: resolve(__dirname, 'buddhism-period-5.html'),
                buddhismPeriod6: resolve(__dirname, 'buddhism-period-6.html'),
            },
        },
        copyPublicDir: true,
    },
    server: {
        port: 3000,
        open: true,
    },
});
