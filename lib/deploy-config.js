// Fallback cấu hình khi deploy Vercel (file JSON ngoài bundle không đọc được).
// Ưu tiên: Environment Variables → file local gitignored → deploy-config này.
module.exports = {
  supabase: {
    url: 'https://hngussrpxqagarobjmsa.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZ3Vzc3JweHFhZ2Fyb2JqbXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxODY2NjgsImV4cCI6MjA5NTc2MjY2OH0.E5s-Bcy9YL9eLvIsx8-b7T2TBHGYdTGL2_tVvK4-iHs',
    table: 'leads',
  },
  telegram: {
    botToken: '8585194797:AAFBmIpj5-qpbhmwXaG7IJ69nh8UxoQ5-vc',
    chatId: '953325928',
  },
};
