module.exports = {
    base: '/vue-apollo-model/',
    serviceWorker: true,
    head: [
        ['link', { rel: 'icon', href: '/favicon.png' }],
    ],
    locales: {
        '/': {
            lang: '简体中文',
            title: 'Vue Apollo Model',
            description: '基于Apollo的Vue.js状态管理方案',
        }
    },
    themeConfig: {
        repo: 'skyline0705/vue-apollo-model',
        docsDir: 'docs',
        locales: {
            '/': {
                sidebarDepth: 3,
                sidebar: {
                    '/guide/': [
                        '',
                        {
                            title: '指南',
                            collapsable: false,
                            children: [
                                'installation',
                                'store',
                                'model',
                                'component',
                                'server-side-render'
                            ]
                        }
                    ],
                    '/api/': [{
                        title: 'API参考',
                        collapsable: false,
                        children: [
                            'base-model',
                            'apollo-query',
                            'apollo-mutation',
                            'rest-query',
                            'rest-mutation',
                        ]
                    }]
                },
                nav: [
                    { text: '主页', link: '/' },
                    { text: '指南', link: '/guide/' },
                    { text: 'API参考', link: '/api/' },
                ]
            }
        },
    }
}