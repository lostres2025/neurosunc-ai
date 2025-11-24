import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth'; // 1. Importamos seguridad
import prisma from '@/lib/prisma'; // 2. Importamos Prisma

// Configuración del cliente Groq
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Función para normalizar una puntuación a una escala de 0-100
const normalize = (value: number, min: number, max: number) => {
  if (max === min) return 50; // Evitar división por cero
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

export async function GET(request: Request) {
  try {
    // 3. SEGURIDAD: Obtener usuario de la sesión
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 4. OBTENER DATOS (Últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Ejecutamos las consultas en paralelo para mayor velocidad
    const [logs, sessions] = await Promise.all([
      prisma.dailyLog.findMany({ 
        where: { userId, date: { gte: thirtyDaysAgo } } 
      }),
      prisma.gameSession.findMany({ 
        where: { userId, createdAt: { gte: thirtyDaysAgo } } 
      })
    ]);

    // Validación mínima de datos para generar perfil
    if (logs.length < 1 || sessions.length < 1) {
      // Devolvemos un error 404 controlado que el widget manejará mostrando el "EmptyState"
      return NextResponse.json({ error: "Datos insuficientes" }, { status: 404 });
    }

    // 5. CALCULAR MÉTRICAS
    const memorySessions = sessions.filter(s => s.gameType === 'MEMORY_WORK');
    const attentionSessions = sessions.filter(s => s.gameType === 'ATTENTION_STROOP');

    // A) Memoria
    const maxMemoryLevel = memorySessions.length > 0 ? Math.max(0, ...memorySessions.map(s => s.level)) : 0;
    const avgMemoryScore = memorySessions.length > 0 ? memorySessions.reduce((a, b) => a + b.score, 0) / memorySessions.length : 0;
    // Normalizamos: Nivel (1-10) pesa 70%, Score (0-500) pesa 30%
    const memoryScore = normalize(maxMemoryLevel, 1, 10) * 0.7 + normalize(avgMemoryScore, 0, 500) * 0.3;

    // B) Atención
    const avgAttentionScore = attentionSessions.length > 0 ? attentionSessions.reduce((a, b) => a + b.score, 0) / attentionSessions.length : 0;
    const attentionScore = normalize(avgAttentionScore, 0, 300);

    // C) Bienestar
    const avgMood = logs.reduce((a, b) => a + b.mood, 0) / logs.length;
    const avgFatigue = logs.reduce((a, b) => a + b.fatigue, 0) / logs.length;
    // Bienestar: Ánimo pesa 60%, (5 - Fatiga) pesa 40%
    const wellnessScore = normalize(avgMood, 1, 5) * 0.6 + normalize(5 - avgFatigue, 0, 4) * 0.4;

    const scores = {
      memory: Math.round(memoryScore) || 0,
      attention: Math.round(attentionScore) || 0,
      wellness: Math.round(wellnessScore) || 0,
    };

    // 6. GENERAR RESUMEN CON IA (Groq)
    const systemPrompt = `
      Eres "NeuroSync Analyst". Analiza el perfil cognitivo de un usuario y escribe un resumen de 2 puntos:
      1. **Tu Fortaleza Principal:** Identifica la puntuación más alta y felicita al usuario.
      2. **Tu Área de Enfoque:** Identifica la puntuación más baja y da un consejo breve para mejorarla.
      Sé breve y motivador. Usa formato Markdown (negritas).
    `;
    
    const userData = `Datos del Perfil (0-100): Memoria=${scores.memory}, Atención=${scores.attention}, Bienestar=${scores.wellness}.`;
    
    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192", // Modelo corregido
      messages: [
        { role: "system", content: systemPrompt }, 
        { role: "user", content: userData }
      ],
      temperature: 0.6,
      max_tokens: 200,
    });

    const summary = completion.choices[0]?.message?.content || "Sigue entrenando para obtener un análisis detallado.";

    return NextResponse.json({ scores, summary });

  } catch (error) {
    console.error('[COGNITIVE_PROFILE_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar el perfil.' }, { status: 500 });
  }
}