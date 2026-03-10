import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
	plugins: [vue(), tailwindcss()],
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
		hmr: {
			overlay: false,
		}
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', (import.meta as any).url)),
		},
	},
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				// 静态资源分类打包
				chunkFileNames: 'static/js/[name]-[hash].js',
				entryFileNames: 'static/js/[name]-[hash].js',
				assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
				// 核心库分包
				manualChunks(id) {
					if (id.includes('node_modules')) {
						if (id.includes('vue')) return 'vue-vendor';
						return 'libs';
					}
				},
			},
		},
	},
});
