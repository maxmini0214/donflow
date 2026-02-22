import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'DonFlow',
  description: 'Your finances. Your browser. Your rules. — Zero-backend budget tracking.',
  base: '/donflow/docs/',

  head: [
    ['meta', { property: 'og:title', content: 'DonFlow Docs' }],
    ['meta', { property: 'og:description', content: 'Zero-backend, zero-tracking budget app. Plan vs Reality in your browser.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'DonFlow',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Try DonFlow', link: 'https://maxmini0214.github.io/donflow/' },
      { text: 'Try Demo', link: 'https://maxmini0214.github.io/donflow/?demo' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Features', link: '/guide/features' },
        ]
      },
      {
        text: 'Deep Dive',
        items: [
          { text: 'Architecture', link: '/guide/architecture' },
          { text: 'Privacy', link: '/guide/privacy' },
          { text: 'Data Portability', link: '/guide/data-portability' },
        ]
      },
      {
        text: 'More',
        items: [
          { text: 'FAQ', link: '/guide/faq' },
          { text: 'Contributing', link: '/guide/contributing' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/maxmini0214/donflow' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: '© 2025 DonFlow — Zero AI · Zero Backend · Zero Tracking'
    },

    editLink: {
      pattern: 'https://github.com/maxmini0214/donflow/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
    }
  }
})
