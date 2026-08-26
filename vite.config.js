import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var githubPagesBase = '/multi-skill-scheduler/';
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        base: command === 'build' ? githubPagesBase : '/',
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 5173,
        },
    });
});
