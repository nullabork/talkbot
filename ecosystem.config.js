module.exports = {
    apps: [
        {
            name: 'docker',
            script: './bot.js',
            exp_backoff_restart_delay: 100,
            error_file: 'err.log',
            out_file: 'out.log',
            log_file: 'combined.log',
            env: {
                NODE_ENV: 'production',
                GOOGLE_APPLICATION_CREDENTIALS: '/usr/src/app/config/google-auth.json',
            },
        },
        {
            name: 'server',
            script: './bot.js',
            exp_backoff_restart_delay: 100,
            error_file: 'err.log',
            out_file: 'out.log',
            log_file: 'combined.log',
            env: {
                NODE_ENV: 'production',
                GOOGLE_APPLICATION_CREDENTIALS: '/root/.google/auth.json',
            },
        },
    ],
};
