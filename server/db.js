const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'db', 'academia.sqlite');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
const db = new Database(dbFile);
db.pragma('foreign_keys = ON');
function init(){
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  db.exec(schema);
  ensureDefaultAdmin();
  seedExercises();
  seedWorkouts();
}
function ensureDefaultAdmin(){
  const hash = bcrypt.hashSync('051309', 10);
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get('olitech');
  if(!existing){
    db.prepare('INSERT INTO users (name,email,password_hash,role,active) VALUES (?,?,?,?,1)').run('Olitech','olitech',hash,'admin');
  }else{
    db.prepare('UPDATE users SET name=?, password_hash=?, role=?, active=1 WHERE email=?').run('Olitech', hash, 'admin', 'olitech');
  }
}
function seedExercises(){
  const count = db.prepare('SELECT COUNT(*) c FROM exercises').get().c;
  if(count) return;
  const rows = [
    ['Supino reto','Peito',120,'https://www.youtube.com/results?search_query=supino+reto','Manter escápulas encaixadas e controlar a descida.'],
    ['Supino inclinado','Peito',110,'https://www.youtube.com/results?search_query=supino+inclinado','Executar com amplitude segura.'],
    ['Crucifixo','Peito',80,'https://www.youtube.com/results?search_query=crucifixo+academia','Evitar carga excessiva.'],
    ['Puxada frente','Costas',115,'https://www.youtube.com/results?search_query=puxada+frente','Puxar até a parte superior do peito.'],
    ['Remada baixa','Costas',110,'https://www.youtube.com/results?search_query=remada+baixa','Coluna neutra durante todo movimento.'],
    ['Agachamento livre','Pernas',180,'https://www.youtube.com/results?search_query=agachamento+livre','Joelhos alinhados com os pés.'],
    ['Leg press','Pernas',160,'https://www.youtube.com/results?search_query=leg+press','Não travar totalmente os joelhos.'],
    ['Cadeira extensora','Pernas',90,'https://www.youtube.com/results?search_query=cadeira+extensora','Contrair quadríceps no topo.'],
    ['Mesa flexora','Posterior',90,'https://www.youtube.com/results?search_query=mesa+flexora','Executar sem tirar quadril do banco.'],
    ['Desenvolvimento ombro','Ombros',100,'https://www.youtube.com/results?search_query=desenvolvimento+ombro','Evitar arquear lombar.'],
    ['Elevação lateral','Ombros',75,'https://www.youtube.com/results?search_query=elevacao+lateral','Subir até linha dos ombros.'],
    ['Rosca direta','Bíceps',70,'https://www.youtube.com/results?search_query=rosca+direta','Cotovelos fixos.'],
    ['Tríceps corda','Tríceps',75,'https://www.youtube.com/results?search_query=triceps+corda','Abrir corda no final.'],
    ['Abdominal prancha','Abdômen',60,'https://www.youtube.com/results?search_query=prancha+abdominal','Manter corpo alinhado.'],
    ['Esteira caminhada','Cardio',220,'https://www.youtube.com/results?search_query=esteira+caminhada','Ajustar velocidade conforme condicionamento.']
  ];
  const grupos = ['Peito','Costas','Pernas','Posterior','Ombros','Bíceps','Tríceps','Abdômen','Cardio','Glúteos','Panturrilha','Funcional'];
  const bases = ['Supino','Remada','Agachamento','Puxada','Rosca','Tríceps','Elevação','Desenvolvimento','Leg press','Abdominal','Prancha','Afundo','Cadeira extensora','Mesa flexora','Stiff','Panturrilha','Esteira','Bicicleta','Elíptico','Crossover'];
  let n = 1;
  while(rows.length < 2000){
    const base = bases[n % bases.length];
    const grupo = grupos[n % grupos.length];
    const nivel = ['iniciante','intermediário','avançado','bodybuilder'][n % 4];
    const nome = `${base} variação ${n} - ${nivel}`;
    rows.push([nome, grupo, 50 + (n % 180), `https://www.youtube.com/results?search_query=${encodeURIComponent(nome)}`, 'Executar com postura correta, controle do movimento e carga adequada ao aluno.']);
    n++;
  }
  const ins = db.prepare('INSERT INTO exercises(name,muscle_group,default_calories,youtube_url,instructions) VALUES (?,?,?,?,?)');
  const tx = db.transaction(()=>rows.forEach(r=>ins.run(...r)));
  tx();
}
function seedWorkouts(){
  const count = db.prepare('SELECT COUNT(*) c FROM workouts').get().c;
  if(count) return;
  const w = db.prepare('INSERT INTO workouts(title,level,split_type,goal,description) VALUES (?,?,?,?,?)').run('Treino ABC Emagrecimento + Massa','intermediário','ABC','emagrecer e ganhar massa muscular','Treino base com musculação e cardio.');
  const items = [
    ['A','Supino reto',4,'10-12','',60,120,1],['A','Supino inclinado',3,'10-12','',60,110,2],['A','Tríceps corda',3,'12','',45,75,3],
    ['B','Puxada frente',4,'10-12','',60,115,1],['B','Remada baixa',3,'10-12','',60,110,2],['B','Rosca direta',3,'12','',45,70,3],
    ['C','Agachamento livre',4,'10','',90,180,1],['C','Leg press',4,'12','',90,160,2],['C','Esteira caminhada',1,'20 min','moderado',0,220,3]
  ];
  const ex = db.prepare('SELECT id,youtube_url FROM exercises WHERE name=?');
  const ins = db.prepare('INSERT INTO workout_exercises(workout_id,exercise_id,custom_name,day_code,series,reps,load_text,rest_seconds,calories,video_url,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const tx = db.transaction(()=>items.forEach(i=>{const e=ex.get(i[1]); ins.run(w.lastInsertRowid,e?.id,i[1],i[0],i[2],i[3],i[4],i[5],i[6],e?.youtube_url,i[7]);})); tx();
}
module.exports = { db, init };
