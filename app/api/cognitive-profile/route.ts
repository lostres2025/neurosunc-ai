// app/api/cognitive-profile/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
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
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'Falta ID de usuario.' }, { status: 400 });
  }

  try {
    // 1. OBTENER TODOS LOS DATOS DEL USUARIO
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.dailyLog.findMany({ where: { userId, date: { gte: thirtyDaysAgo } } });
    const sessions = await prisma.gameSession.findMany({ where: { userId, createdAt: { gte: thirtyDaysAgo } } });

    if (logs.length < 3 || sessions.length < 5) {
      return NextResponse.json({ error: "No hay suficientes datos para generar un perfil." }, { status: 404 });
    }

    // 2. CALCULAR LAS MÉTRICAS
    const memorySessions = sessions.filter(s => s.gameType === 'MEMORY_WORK');
    const attentionSessions = sessions.filter(s => s.gameType === 'ATTENTION_STROOP');

    // Métrica 1: Memoria (basada en nivel máximo y puntuación promedio)
    const maxMemoryLevel = Math.max(0, ...memorySessions.map(s => s.level));
    const avgMemoryScore = memorySessions.length > 0 ? memorySessions.reduce((a, b) => a + b.score, 0) / memorySessions.length : 0;
    const memoryScore = normalize(maxMemoryLevel, 1, 10) * 0.7 + normalize(avgMemoryScore, 0, 500) * 0.3;

    // Métrica 2: Atención (basada en puntuación promedio)
    const avgAttentionScore = attentionSessions.length > 0 ? attentionSessions.reduce((a, b) => a + b.score, 0) / attentionSessions.length : 0;
    const attentionScore = normalize(avgAttentionScore, 0, 300);

    // Métrica 3: Bienestar (basado en ánimo y fatiga promedio)
    const avgMood = logs.reduce((a, b) => a + b.mood, 0) / logs.length;
    const avgFatigue = logs.reduce((a, b) => a + b.fatigue, 0) / logs.length;
    const wellnessScore = normalize(avgMood, 1, 5) * 0.6 + normalize(5 - avgFatigue, 0, 4) * 0.4;

    const scores = {
      memory: Math.round(memoryScore),
      attention: Math.round(attentionScore),
      wellness: Math.round(wellnessScore),
    };

    // 3. GENERAR RESUMEN CON IA
    const systemPrompt = `
      Eres "NeuroSync Analyst". Analiza el perfil cognitivo de un usuario y escribe un resumen de 2 puntos:
      1.  **Tu Fortaleza Principal:** Identifica la puntuación más alta y felicita al usuario por ello.
      2.  **Tu Área de Enfoque:** Identifica la puntuación más baja y da un consejo accionable para mejorarla.
      Sé breve y motivador. Responde solo con el texto de los 2 puntos.
    `;
    const userData = `Datos del Perfil: Memoria=${scores.memory}/100, Atención=${scores.attention}/100, Bienestar Emocional=${scores.wellness}/100.`;
    
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userData }],
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({ scores, summary });

  } catch (error) {
    console.error('[COGNITIVE_PROFILE_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar el perfil.' }, { status: 500 });
  }
}