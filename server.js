const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({limit:'10mb'}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (_req, res) => {
  res.json({
    version: process.env.APP_VERSION || '2.0.0',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

app.get('/health', (_req, res) => res.json({ok:true, app:'Academia Olitech', version: process.env.APP_VERSION || '2.0.0'}));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Academia Olitech v2 rodando na porta ${PORT}`));
