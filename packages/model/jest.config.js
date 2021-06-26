// TODO 临时解决 jest 版本不一致的问题，后续可能会改下 @pengjunzhe
module.exports = {
    // preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    testMatch: [
        '**/tests/unit/**/*.spec.[jt]s?(x)',
        '**/*.spec.[jt]s?(x)',
    ],
};
