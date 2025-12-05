import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    // 1. Seguridad
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { answers } = await request.json();

    // 2. Prompt de Ingeniería para convertir Texto a Números
    const systemPrompt = `
      Eres un psicólogo experto. Analiza las respuestas del usuario y conviértelas en métricas numéricas.
      
      Reglas de Puntuación:
      - MOOD (Ánimo): 1 (Muy mal/Deprimido) a 5 (Excelente/Feliz).
      - FATIGUE (Energía): 1 (Muy agotado) a 5 (Mucha energía).
      - SLEEP (Sueño): Estima las horas (0-12). Si dice "dormí poco", pon 5. Si dice "bien", pon 8.

      Responde ESTRICTAMENTE un JSON con este formato:
      {
        "mood": number,
        "fatigue": number,
        "sleep": number,
        "reason": "Breve frase explicando por qué (máx 10 palabras)"
      }
    `;

    const userContent = `Respuestas del día: 
    1. Sueño: "${answers.q1}"
    2. Ánimo: "${answers.q2}"
    3. Energía: "${answers.q3}"`;

    // 3. Llamada a Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Modelo rápido y capaz
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.1, // Baja temperatura para ser preciso con los números
      response_format: { type: "json_object" } // Forzamos JSON válido
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error analizando ánimo:', error);
    // Si falla, devolvemos valores neutros
    return NextResponse.json({ mood: 3, fatigue: 3, sleep: 7, reason: "No pude analizar, por favor ajusta manual." });
  }
}