import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const normalize = (value: number, min: number, max: number) => {
  if (max === min) return 50; 
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [logs, sessions] = await Promise.all([
      prisma.dailyLog.findMany({ 
        where: { userId, date: { gte: thirtyDaysAgo } } 
      }),
      prisma.gameSession.findMany({ 
        where: { userId, createdAt: { gte: thirtyDaysAgo } } 
      })
    ]);

    if (logs.length < 1 || sessions.length < 1) {
      return NextResponse.json({ error: "Datos insuficientes" }, { status: 404 });
    }

    // --- FILTROS DE JUEGOS ---
    const memorySessions = sessions.filter(s => s.gameType === 'MEMORY_WORK');
    const attentionSessions = sessions.filter(s => s.gameType === 'ATTENTION_STROOP');
    const flexibilitySessions = sessions.filter(s => s.gameType === 'FLEXIBILITY_SHIFT'); // <--- NUEVO

    // 1. Memoria
    const maxMemoryLevel = memorySessions.length > 0 ? Math.max(0, ...memorySessions.map(s => s.level)) : 0;
    const avgMemoryScore = memorySessions.length > 0 ? memorySessions.reduce((a, b) => a + b.score, 0) / memorySessions.length : 0;
    const memoryScore = normalize(maxMemoryLevel, 1, 10) * 0.7 + normalize(avgMemoryScore, 0, 500) * 0.3;

    // 2. Atención
    const avgAttentionScore = attentionSessions.length > 0 ? attentionSessions.reduce((a, b) => a + b.score, 0) / attentionSessions.length : 0;
    const attentionScore = normalize(avgAttentionScore, 0, 300);

    // 3. Flexibilidad (NUEVO CÁLCULO)
    // Asumimos que un puntaje de 200+ es excelente en 60 segundos
    const avgFlexScore = flexibilitySessions.length > 0 ? flexibilitySessions.reduce((a, b) => a + b.score, 0) / flexibilitySessions.length : 0;
    const flexibilityScore = normalize(avgFlexScore, 0, 250);

    // 4. Bienestar
    const avgMood = logs.reduce((a, b) => a + b.mood, 0) / logs.length;
    const avgFatigue = logs.reduce((a, b) => a + b.fatigue, 0) / logs.length;
    const wellnessScore = normalize(avgMood, 1, 5) * 0.6 + normalize(5 - avgFatigue, 0, 4) * 0.4;

    const scores = {
      memory: Math.round(memoryScore) || 0,
      attention: Math.round(attentionScore) || 0,
      flexibility: Math.round(flexibilityScore) || 0, // <--- NUEVO CAMPO
      wellness: Math.round(wellnessScore) || 0,
    };

    // GENERAR RESUMEN CON IA
    const systemPrompt = `
      Eres "NeuroSync Analyst". Analiza el perfil cognitivo de un usuario y escribe un resumen de 2 puntos:
      1. **Tu Fortaleza Principal:** Identifica la puntuación más alta y felicita al usuario.
      2. **Tu Área de Enfoque:** Identifica la puntuación más baja y da un consejo breve para mejorarla.
      Sé breve y motivador. Usa formato Markdown (negritas).
    `;
    
    // Le pasamos el nuevo dato a la IA
    const userData = `Datos del Perfil (0-100): Memoria=${scores.memory}, Atención=${scores.attention}, Flexibilidad=${scores.flexibility}, Bienestar=${scores.wellness}.`;
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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