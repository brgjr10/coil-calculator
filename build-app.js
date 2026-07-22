const { packager } = require('@electron/packager');

async function build() {
    console.log('Starting build...');
    try {
        const paths = await packager({
            dir: '.',
            name: 'Coil Calculator',
            platform: 'win32',
            arch: 'x64',
            out: 'release',
            overwrite: true,
            ignore: (filepath) => {
                // filepath is relative to app root, e.g. "/tests/unit/foo.js"
                const p = filepath.replace(/\\/g, '/');
                if (/^\/node_modules\/@playwright/.test(p)) return true;
                if (/^\/node_modules\/jest/.test(p)) return true;
                if (/^\/node_modules\/@jest/.test(p)) return true;
                if (/^\/node_modules\/@playwright/.test(p)) return true;
                if (/^\/tests(\/|$)/.test(p)) return true;
                if (/^\/test-results(\/|$)/.test(p)) return true;
                if (/^\/dist(\/|$)/.test(p)) return true;
                if (/^\/release(\/|$)/.test(p)) return true;
                if (/^\/\.vscode(\/|$)/.test(p)) return true;
                if (/^\/playwright\.config\.js$/.test(p)) return true;
                if (/^\/jest\.config\.js$/.test(p)) return true;
                if (/^\/check.*\.js$/.test(p)) return true;
                if (/^\/diagnostic\.js$/.test(p)) return true;
                if (/^\/inspect.*\.js$/.test(p)) return true;
                if (/^\/test-.*\.js$/.test(p)) return true;
                if (/^\/start.*\.bat$/.test(p)) return true;
                if (/^\/TESTING\.md$/.test(p)) return true;
                if (/^\/\.gitignore$/.test(p)) return true;
                if (/^\/build-app\.js$/.test(p)) return true;
                if (/^\/package-lock\.json$/.test(p)) return true;
                return false;
            }
        });
        console.log('Built successfully:', paths[0]);
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

build();
