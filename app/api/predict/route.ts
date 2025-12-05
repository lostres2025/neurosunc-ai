import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const logData = await request.json(); // Recibe el último log

    const systemPrompt = `
      Eres un analista de salud mental. Analiza los datos del usuario:
      Sueño: ${logData.sleepHours}h, Ánimo: ${logData.mood}/5, Energía: ${logData.fatigue}/5.
      Genera una "Alerta de Predicción" de 1 frase.
      Si los datos son buenos, felicita. Si son bajos, da un consejo de precaución.
      Ejemplo: "Tu energía está baja hoy; prioriza tareas simples para evitar frustración."
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // <--- MODELO CORRECTO
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const prediction = completion.choices[0]?.message?.content || "Hoy es un buen día para cuidar de ti.";

    return NextResponse.json({ prediction });

  } catch (error) {
    console.error('[PREDICT_API_ERROR]', error);
    return NextResponse.json({ prediction: "Recuerda descansar si lo necesitas." });
  }
}