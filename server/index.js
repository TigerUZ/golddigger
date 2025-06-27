
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const MAX_LIVES       = 6;
const REFILL_INTERVAL = 2 * 60 * 60 * 1000; 


app.get('/status', async (req, res) => {
  const userId = req.query.userId;

 
  let { data: row, error } = await supabase
    .from('game_status')
    .select('*')
    .eq('user_id', userId)
    .single();

  
  if (error && error.code === 'PGRST116') {
    const now = new Date().toISOString();
    const init = {
      user_id:     userId,
      lives:       MAX_LIVES,
      best_score:  0,
      total_score: 0,
      last_refill: now
    };
    await supabase.from('game_status').insert(init);
    return res.json(init);
  }
  if (error) {
    console.error('GET /status error:', error);
    return res.status(500).json({ error });
  }

  
  const nowMs      = Date.now();
  const lastMs     = new Date(row.last_refill).getTime();
  const diffMs     = nowMs - lastMs;
  const refillUnits = Math.floor(diffMs / REFILL_INTERVAL);

  if (row.lives < MAX_LIVES && refillUnits > 0) {
    
    const newLives = Math.min(MAX_LIVES, row.lives + refillUnits);
    
    const newLast = new Date(lastMs + refillUnits * REFILL_INTERVAL).toISOString();

    
    const { error: updErr } = await supabase
      .from('game_status')
      .update({
        lives:       newLives,
        last_refill: newLast
      })
      .eq('user_id', userId);
    if (updErr) console.error('Ошибка автодозаправки:', updErr);

    
    row.lives       = newLives;
    row.last_refill = newLast;
  }

  
  res.json({
    user_id:     row.user_id,
    lives:       row.lives,
    best_score:  row.best_score,
    total_score: row.total_score,
    last_refill: row.last_refill
  });
});


app.post('/save', async (req, res) => {
  const { userId, score, lives } = req.body;

  
  const { data: row, error: selErr } = await supabase
    .from('game_status')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (selErr) {
    console.error('POST /save select error:', selErr);
    return res.status(500).json({ error: selErr });
  }

  const originalLives = row.lives;

  
  const updates = {
    lives,
    best_score:  Math.max(row.best_score, score),
    total_score: row.total_score + score
  };

  
  if (originalLives === MAX_LIVES && lives === MAX_LIVES - 1) {
    updates.last_refill = new Date().toISOString();
  }

  
  const { data, error } = await supabase
    .from('game_status')
    .upsert({ user_id: userId, ...updates });
  if (error) {
    console.error('POST /save upsert error:', error);
    return res.status(500).json({ error });
  }

  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
