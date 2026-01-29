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
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});
