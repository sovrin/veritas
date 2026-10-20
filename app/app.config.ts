// veritas' part of the nexitas shell: its name and icon, its panel on each project, and its
// section in the nav.
export default defineAppConfig({
  nexitas: {
    modules: [
      {
        id: 'veritas',
        label: 'Content',
        description: 'Collections and entries, delivered to your sites as JSON.',
        icon: 'file-text',
        panel: 'VeritasProject',
      },
    ],
    nav: [{ to: '/content', label: 'Content', module: 'veritas' }],
  },
})
