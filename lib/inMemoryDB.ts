import bcrypt from "bcryptjs";
import crypto from "crypto";

export const USE_MEMORY_DB = !process.env.MONGODB_URI;

function newId() {
  return crypto.randomBytes(12).toString("hex");
}

// ─── STORES (module-level, persisten mientras la función esté caliente) ───
const users: any[] = [];
const exercises: any[] = [];
const routines: any[] = [];

// ─── SEED SUPERADMIN ──────────────────────────────────────────────
const SUPERADMIN_HASH = bcrypt.hashSync("superadmin123", 10);
users.push({
  _id: newId(),
  name: "Super Admin",
  email: "superadmin@gymapp.com",
  password: SUPERADMIN_HASH,
  role: "superadmin",
  plan: "pro",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ─── SEED EJERCICIOS ──────────────────────────────────────────────
const EXERCISES_SEED = [
  { name: "Press de banca", category: "Pecho", muscleGroup: ["Pectoral mayor", "Tríceps", "Deltoides anterior"], description: "Acostado en el banco, bajá la barra al pecho y empujá hacia arriba con control.", videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg", difficulty: "intermediate" },
  { name: "Flexiones", category: "Pecho", muscleGroup: ["Pectoral", "Tríceps", "Core"], description: "En posición de plancha, bajá el cuerpo hasta casi tocar el suelo y empujá hacia arriba.", difficulty: "beginner" },
  { name: "Aperturas con mancuernas", category: "Pecho", muscleGroup: ["Pectoral mayor", "Deltoides anterior"], description: "Acostado, con los brazos extendidos bajalos en arco hasta la altura del pecho.", difficulty: "beginner" },
  { name: "Dominadas", category: "Espalda", muscleGroup: ["Dorsal ancho", "Bíceps", "Romboides"], description: "Colgado de la barra, subí el cuerpo hasta que el mentón supere la barra.", videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g", difficulty: "intermediate" },
  { name: "Remo con barra", category: "Espalda", muscleGroup: ["Dorsal ancho", "Romboides", "Bíceps"], description: "Inclinado hacia adelante, llevá la barra al abdomen manteniendo la espalda recta.", difficulty: "intermediate" },
  { name: "Peso muerto", category: "Espalda", muscleGroup: ["Erector espinal", "Glúteos", "Isquiotibiales", "Trapecio"], description: "Con la barra en el suelo, empujá con las piernas y extendé cadera manteniendo la espalda neutra.", videoUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q", difficulty: "advanced" },
  { name: "Sentadilla", category: "Piernas", muscleGroup: ["Cuádriceps", "Glúteos", "Isquiotibiales"], description: "Con los pies al ancho de hombros, bajá como si fueses a sentarte manteniendo el pecho arriba.", videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8", difficulty: "beginner" },
  { name: "Prensa de piernas", category: "Piernas", muscleGroup: ["Cuádriceps", "Glúteos", "Isquiotibiales"], description: "Sentado en la máquina, empujá la plataforma con los pies hasta extender las rodillas.", difficulty: "beginner" },
  { name: "Zancadas", category: "Piernas", muscleGroup: ["Cuádriceps", "Glúteos", "Isquiotibiales"], description: "Da un paso al frente y bajá la rodilla trasera cerca del suelo, alternando piernas.", difficulty: "beginner" },
  { name: "Press militar", category: "Hombros", muscleGroup: ["Deltoides", "Tríceps", "Trapecio"], description: "De pie o sentado, empujá la barra desde los hombros hasta arriba de la cabeza.", difficulty: "intermediate" },
  { name: "Elevaciones laterales", category: "Hombros", muscleGroup: ["Deltoides lateral"], description: "Con mancuernas a los lados, levantá los brazos hasta la altura de los hombros.", difficulty: "beginner" },
  { name: "Curl de bíceps", category: "Brazos", muscleGroup: ["Bíceps braquial"], description: "Con mancuernas o barra, flexioná los codos levantando el peso hacia los hombros.", difficulty: "beginner" },
  { name: "Extensión de tríceps en polea", category: "Brazos", muscleGroup: ["Tríceps"], description: "De pie frente a la polea, empujá la barra hacia abajo extendiendo los codos.", difficulty: "beginner" },
  { name: "Plancha", category: "Core", muscleGroup: ["Recto abdominal", "Oblicuos", "Transverso"], description: "En posición de empuje sobre los antebrazos, mantené el cuerpo recto durante el tiempo indicado.", difficulty: "beginner" },
  { name: "Abdominales", category: "Core", muscleGroup: ["Recto abdominal"], description: "Acostado boca arriba, flexioná el tronco llevando los hombros hacia las rodillas.", difficulty: "beginner" },
  { name: "Bicicleta estática", category: "Cardio", muscleGroup: ["Piernas", "Cardiovascular"], description: "Pedaleo continuo en bicicleta estática para trabajo aeróbico.", difficulty: "beginner" },
  { name: "Salto a la comba", category: "Cardio", muscleGroup: ["Pantorrillas", "Cardiovascular"], description: "Saltá la cuerda con ambos pies juntos o alternando. Excelente cardio de alta intensidad.", difficulty: "intermediate" },
];

for (const ex of EXERCISES_SEED) {
  exercises.push({ _id: newId(), ...ex, createdAt: new Date(), updatedAt: new Date() });
}

// ─── HELPERS ──────────────────────────────────────────────────────
function matchQuery(item: any, query: any): boolean {
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && typeof value === "object" && "$gt" in (value as any)) {
      if (!(item[key] > (value as any).$gt)) return false;
    } else if (value !== null && typeof value === "object" && "$regex" in (value as any)) {
      const regex = new RegExp((value as any).$regex, (value as any).$options || "");
      if (!regex.test(item[key])) return false;
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

function withoutPassword(u: any) {
  const { password, ...rest } = u;
  return rest;
}

function makeDoc(item: any, store: any[]) {
  const proxy = new Proxy(item, {
    set(target, prop, value) {
      target[prop as string] = value;
      const idx = store.findIndex((i) => i._id === target._id);
      if (idx >= 0) store[idx] = target;
      return true;
    },
  });
  proxy.save = async () => {
    const idx = store.findIndex((i) => i._id === item._id);
    if (idx >= 0) store[idx] = { ...item };
  };
  return proxy;
}

// ─── QUERY BUILDER (soporta .populate().sort() encadenado) ────────
class MemoryQuery {
  private data: any[];

  constructor(data: any[]) {
    this.data = [...data];
  }

  populate(_path: string) {
    this.data = this.data.map((routine) => ({
      ...routine,
      days: (routine.days || []).map((day: any) => ({
        ...day,
        exercises: (day.exercises || []).map((ex: any) => ({
          ...ex,
          exerciseId: exercises.find((e) => e._id === ex.exerciseId) || ex.exerciseId,
        })),
      })),
    }));
    return this;
  }

  sort(criteria: Record<string, number>) {
    const [key, dir] = Object.entries(criteria)[0];
    this.data.sort((a, b) => {
      const aVal = a[key] instanceof Date ? a[key].getTime() : a[key];
      const bVal = b[key] instanceof Date ? b[key].getTime() : b[key];
      if (typeof aVal === "string") return dir === 1 ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return dir === 1 ? (aVal ?? 0) - (bVal ?? 0) : (bVal ?? 0) - (aVal ?? 0);
    });
    return this;
  }

  then(resolve: (v: any) => any, reject: (e: any) => any) {
    return Promise.resolve(this.data).then(resolve, reject);
  }
}

// ─── MEMORY USER ──────────────────────────────────────────────────
export const MemoryUser = {
  async findOne(query: any) {
    const item = users.find((u) => matchQuery(u, query));
    return item ? makeDoc({ ...item }, users) : null;
  },
  async findById(id: string) {
    const item = users.find((u) => u._id === id);
    return item ? makeDoc({ ...item }, users) : null;
  },
  find(query: any = {}, _select?: string) {
    const result = users.filter((u) => matchQuery(u, query)).map(withoutPassword);
    return new MemoryQuery(result);
  },
  async create(data: any) {
    const doc = { _id: newId(), ...data, createdAt: new Date(), updatedAt: new Date() };
    users.push(doc);
    return makeDoc({ ...doc }, users);
  },
  async findByIdAndUpdate(id: string, data: any, _options?: any) {
    const idx = users.findIndex((u) => u._id === id);
    if (idx < 0) return null;
    users[idx] = { ...users[idx], ...data, updatedAt: new Date() };
    return withoutPassword(users[idx]);
  },
  async findByIdAndDelete(id: string) {
    const idx = users.findIndex((u) => u._id === id);
    if (idx >= 0) users.splice(idx, 1);
  },
};

// ─── MEMORY EXERCISE ──────────────────────────────────────────────
export const MemoryExercise = {
  find(query: any = {}) {
    const result = exercises.filter((e) => matchQuery(e, query));
    return new MemoryQuery(result);
  },
  async findById(id: string) {
    return exercises.find((e) => e._id === id) || null;
  },
  async create(data: any) {
    const doc = { _id: newId(), ...data, createdAt: new Date(), updatedAt: new Date() };
    exercises.push(doc);
    return doc;
  },
  async findByIdAndUpdate(id: string, data: any, _options?: any) {
    const idx = exercises.findIndex((e) => e._id === id);
    if (idx < 0) return null;
    exercises[idx] = { ...exercises[idx], ...data, updatedAt: new Date() };
    return exercises[idx];
  },
  async findByIdAndDelete(id: string) {
    const idx = exercises.findIndex((e) => e._id === id);
    if (idx >= 0) exercises.splice(idx, 1);
  },
  async deleteMany(_query: any) {
    exercises.length = 0;
  },
  async insertMany(data: any[]) {
    const docs = data.map((d) => ({ _id: newId(), ...d, createdAt: new Date(), updatedAt: new Date() }));
    exercises.push(...docs);
    return docs;
  },
};

// ─── MEMORY ROUTINE ───────────────────────────────────────────────
export const MemoryRoutine = {
  find(query: any = {}) {
    const result = routines.filter((r) => matchQuery(r, query));
    return new MemoryQuery(result);
  },
  async create(data: any) {
    const doc = { _id: newId(), ...data, createdAt: new Date(), updatedAt: new Date() };
    routines.push(doc);
    return doc;
  },
  async findOneAndUpdate(query: any, data: any, _options?: any) {
    const idx = routines.findIndex((r) => matchQuery(r, query));
    if (idx < 0) return null;
    routines[idx] = { ...routines[idx], ...data, updatedAt: new Date() };
    return routines[idx];
  },
  async findOneAndDelete(query: any) {
    const idx = routines.findIndex((r) => matchQuery(r, query));
    if (idx >= 0) routines.splice(idx, 1);
  },
};
