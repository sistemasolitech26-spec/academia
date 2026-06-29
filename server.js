require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { db, init } = require('./server/db');
init();
const app = express();
app.use(cors());
app.use(express.json({limit:'10mb'}));
app.use(express.static(path.join(__dirname,'public')));
const secret = process.env.JWT_SECRET || 'dev-secret';
function auth(req,res,next){
  const h=req.headers.authorization||''; const token=h.replace('Bearer ','');
  if(!token) return res.status(401).json({error:'Sem autorização'});
  try{req.user=jwt.verify(token,secret); next();}catch(e){res.status(401).json({error:'Sessão expirada'});}
}
function adminOrProf(req,res,next){ if(['admin','professor'].includes(req.user.role)) return next(); res.status(403).json({error:'Sem permissão'}); }
app.post('/api/login',(req,res)=>{ const {email,password}=req.body; const u=db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(email); if(!u||!bcrypt.compareSync(password,u.password_hash)) return res.status(401).json({error:'Login ou senha inválido'}); const token=jwt.sign({id:u.id,name:u.name,email:u.email,role:u.role},secret,{expiresIn:'12h'}); res.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role}}); });
app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.get('/api/exercises',auth,(req,res)=>{const q=(req.query.q||'').trim(); const rows=q?db.prepare('SELECT * FROM exercises WHERE name LIKE ? OR muscle_group LIKE ? ORDER BY name LIMIT 200').all(`%${q}%`,`%${q}%`):db.prepare('SELECT * FROM exercises ORDER BY name LIMIT 200').all(); res.json(rows);});
app.post('/api/exercises',auth,adminOrProf,(req,res)=>{ const b=req.body; if(!b.name) return res.status(400).json({error:'Nome obrigatório'}); const r=db.prepare('INSERT INTO exercises(name,muscle_group,default_calories,youtube_url,instructions) VALUES (?,?,?,?,?)').run(b.name,b.muscle_group||'',Number(b.default_calories||0),b.youtube_url||'',b.instructions||''); res.json(db.prepare('SELECT * FROM exercises WHERE id=?').get(r.lastInsertRowid)); });
app.put('/api/exercises/:id',auth,adminOrProf,(req,res)=>{ const b=req.body; db.prepare('UPDATE exercises SET name=?, muscle_group=?, default_calories=?, youtube_url=?, instructions=? WHERE id=?').run(b.name,b.muscle_group||'',Number(b.default_calories||0),b.youtube_url||'',b.instructions||'',req.params.id); res.json(db.prepare('SELECT * FROM exercises WHERE id=?').get(req.params.id)); });
app.delete('/api/exercises/:id',auth,adminOrProf,(req,res)=>{ db.prepare('DELETE FROM exercises WHERE id=?').run(req.params.id); res.json({ok:true}); });
app.get('/api/students',auth,(req,res)=>res.json(db.prepare('SELECT * FROM students ORDER BY name').all()));
app.post('/api/students',auth,adminOrProf,(req,res)=>{ const b=req.body; const r=db.prepare('INSERT INTO students(name,phone,goal,weight,height) VALUES (?,?,?,?,?)').run(b.name,b.phone||'',b.goal||'',b.weight||null,b.height||null); res.json(db.prepare('SELECT * FROM students WHERE id=?').get(r.lastInsertRowid));});
app.put('/api/students/:id',auth,adminOrProf,(req,res)=>{ const b=req.body; db.prepare('UPDATE students SET name=?,phone=?,goal=?,weight=?,height=? WHERE id=?').run(b.name,b.phone||'',b.goal||'',b.weight||null,b.height||null,req.params.id); res.json(db.prepare('SELECT * FROM students WHERE id=?').get(req.params.id));});
app.delete('/api/students/:id',auth,adminOrProf,(req,res)=>{ db.prepare('DELETE FROM students WHERE id=?').run(req.params.id); res.json({ok:true});});
function workoutFull(id){ const w=db.prepare('SELECT * FROM workouts WHERE id=?').get(id); if(!w) return null; w.exercises=db.prepare(`SELECT we.*, COALESCE(we.custom_name,e.name) as name, e.muscle_group, e.instructions FROM workout_exercises we LEFT JOIN exercises e ON e.id=we.exercise_id WHERE we.workout_id=? ORDER BY day_code, sort_order, id`).all(id); return w; }
app.get('/api/workouts',auth,(req,res)=>{ const q=(req.query.q||'').trim(); const rows=q?db.prepare('SELECT w.*,s.name student_name FROM workouts w LEFT JOIN students s ON s.id=w.student_id WHERE w.title LIKE ? OR w.goal LIKE ? OR w.split_type LIKE ? ORDER BY w.id DESC').all(`%${q}%`,`%${q}%`,`%${q}%`):db.prepare('SELECT w.*,s.name student_name FROM workouts w LEFT JOIN students s ON s.id=w.student_id ORDER BY w.id DESC').all(); res.json(rows); });
app.get('/api/workouts/:id',auth,(req,res)=>{ const w=workoutFull(req.params.id); if(!w) return res.status(404).json({error:'Treino não encontrado'}); res.json(w); });
app.post('/api/workouts',auth,adminOrProf,(req,res)=>{ const b=req.body; if(!b.title) return res.status(400).json({error:'Título obrigatório'}); const r=db.prepare('INSERT INTO workouts(title,level,split_type,goal,description,student_id) VALUES (?,?,?,?,?,?)').run(b.title,b.level||'iniciante',b.split_type||'A',b.goal||'',b.description||'',b.student_id||null); res.json(workoutFull(r.lastInsertRowid)); });
app.put('/api/workouts/:id',auth,adminOrProf,(req,res)=>{ const b=req.body; db.prepare('UPDATE workouts SET title=?,level=?,split_type=?,goal=?,description=?,student_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(b.title,b.level||'iniciante',b.split_type||'A',b.goal||'',b.description||'',b.student_id||null,req.params.id); res.json(workoutFull(req.params.id)); });
app.delete('/api/workouts/:id',auth,adminOrProf,(req,res)=>{ db.prepare('DELETE FROM workouts WHERE id=?').run(req.params.id); res.json({ok:true}); });
app.post('/api/workouts/:id/items',auth,adminOrProf,(req,res)=>{ const b=req.body; const ex=b.exercise_id?db.prepare('SELECT * FROM exercises WHERE id=?').get(b.exercise_id):null; const r=db.prepare(`INSERT INTO workout_exercises(workout_id,exercise_id,custom_name,day_code,series,reps,load_text,rest_seconds,calories,video_url,notes,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.params.id,b.exercise_id||null,b.custom_name||ex?.name||'',b.day_code||'A',Number(b.series||3),b.reps||'12',b.load_text||'',Number(b.rest_seconds||60),Number(b.calories||ex?.default_calories||0),b.video_url||ex?.youtube_url||'',b.notes||'',Number(b.sort_order||0)); res.json(workoutFull(req.params.id)); });
app.put('/api/workout-items/:itemId',auth,adminOrProf,(req,res)=>{ const b=req.body; const old=db.prepare('SELECT workout_id FROM workout_exercises WHERE id=?').get(req.params.itemId); if(!old) return res.status(404).json({error:'Item não encontrado'}); db.prepare(`UPDATE workout_exercises SET exercise_id=?,custom_name=?,day_code=?,series=?,reps=?,load_text=?,rest_seconds=?,calories=?,video_url=?,notes=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(b.exercise_id||null,b.custom_name||'',b.day_code||'A',Number(b.series||3),b.reps||'12',b.load_text||'',Number(b.rest_seconds||60),Number(b.calories||0),b.video_url||'',b.notes||'',Number(b.sort_order||0),req.params.itemId); res.json(workoutFull(old.workout_id)); });
app.delete('/api/workout-items/:itemId',auth,adminOrProf,(req,res)=>{ const old=db.prepare('SELECT workout_id FROM workout_exercises WHERE id=?').get(req.params.itemId); if(!old) return res.status(404).json({error:'Item não encontrado'}); db.prepare('DELETE FROM workout_exercises WHERE id=?').run(req.params.itemId); res.json(workoutFull(old.workout_id)); });
app.post('/api/workout-items/:itemId/done',auth,(req,res)=>{ const it=db.prepare('SELECT * FROM workout_exercises WHERE id=?').get(req.params.itemId); if(!it) return res.status(404).json({error:'Exercício não encontrado'}); db.prepare('INSERT INTO workout_logs(workout_id,student_id,workout_exercise_id,done,notes) VALUES (?,?,?,?,?)').run(it.workout_id,req.body.student_id||null,it.id,1,req.body.notes||''); res.json({ok:true}); });
app.get('/api/dashboard',auth,(req,res)=>{ res.json({workouts:db.prepare('SELECT COUNT(*) c FROM workouts').get().c, exercises:db.prepare('SELECT COUNT(*) c FROM exercises').get().c, students:db.prepare('SELECT COUNT(*) c FROM students').get().c, logs:db.prepare('SELECT COUNT(*) c FROM workout_logs').get().c}); });
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(process.env.PORT||3000,()=>console.log('Academia V3 online'));
