// veritas' part of the nexitas shell: its name, icon and hue, and its section in the nav.
export default defineAppConfig({
  nexitas: {
    modules: [
      {
        id: 'veritas',
        label: 'Content',
        description: 'Collections and entries, delivered to your sites as JSON.',
        icon: 'file-text',
        accent: 'indigo',
      },
    ],
    nav: [{ to: '/content', label: 'Content', module: 'veritas' }],
  },
})
