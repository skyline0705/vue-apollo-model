import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import {join} from 'path';

const PACKAGE_ROOT_PATH = process.cwd();

const OUTPUT_DIR = join(PACKAGE_ROOT_PATH, 'dist');
const PKG_JSON = require(join(PACKAGE_ROOT_PATH, 'package.json'));

const entires = [{
    input: join(PACKAGE_ROOT_PATH, 'src/main.ts'),
    format: {
        dist: 'cjs',
        ts: 'es5',
        name: 'index.js'
    }
}, {
    input: join(PACKAGE_ROOT_PATH, 'src/module.ts'),
    format: {
        dist: 'es',
        ts: 'es5',
        name: 'index.es.js'
    }
}, {
    input: join(PACKAGE_ROOT_PATH, 'src/clients/gql.ts'),
    // TODO这两个下一版本里面继续拆包吧= =
    format: {
        dist: 'es',
        ts: 'es5',
        name: 'clients/gql.js'
    }
}, {
    input: join(PACKAGE_ROOT_PATH, 'src/clients/rest.ts'),
    // TODO这两个下一版本里面继续拆包吧= =
    format: {
        dist: 'es',
        ts: 'es5',
        name: 'clients/rest.js'
    }
}];

export default entires.map(entryConfig => ({
    plugins: [
        resolve({browser: true}),
        commonjs(),
        typescript({
            clean: true,
            tsconfigOverride: {
                compilerOptions: {target: entryConfig.format.ts},
            },
        }),
    ],
    input: entryConfig.input,
    external: [
        ...Object.keys(PKG_JSON.peerDependencies || {}),
        ...Object.keys(PKG_JSON.dependencies || {}),
    ],
    output: [
        {
            file: join(OUTPUT_DIR, entryConfig.format.name),
            format: entryConfig.format.dist,
            sourcemap: true,
            name: PKG_JSON.name,
        },
    ],
}));
