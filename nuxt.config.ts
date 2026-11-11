// AutoTrain 3D - ADMIN. A separate app from the student app: its own address, its own login.
// It uses the same Turso database as the student app, so what the admin saves shows up in the student app.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  ssr: false,                                   // the admin is a small single page app: it runs in the browser, the server only answers the API
  app: {
    head: {
      title: 'AutoTrain 3D - Admin',
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },         // search engines must not list the admin
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  routeRules: {
    '/**': { headers: { 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' } }
  }
})
