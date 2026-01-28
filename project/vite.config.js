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
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});
