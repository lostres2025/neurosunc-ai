import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth'; // 1. Agregamos seguridad (Opcional pero recomendado)

// 2. Forzamos a que la ruta sea dinámica para que no cachee siempre la misma frase
export const dynamic = 'force-dynamic';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const themes = [
  'un dato curioso sobre la memoria',
  'un consejo práctico para mejorar la concentración',
  'un micro-ejercicio de mindfulness de menos de 1 minuto',
  'una cita inspiradora sobre el aprendizaje y la mente',
  'una explicación simple sobre cómo el sueño afecta al cerebro',
  'un tip para reducir la fatiga mental',
];

export async function GET() {
  try {
    // 3. Verificamos sesión (para que no te gasten la API gente de fuera)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const systemPrompt = `
      Eres "NeuroSync Coach". Tu tarea es generar una "píldora cognitiva" del día.
      Debe ser un contenido muy breve (máximo 2 frases), interesante y fácil de entender.
      El tema de hoy es: "${randomTheme}".
      Tu respuesta debe ser SOLO el texto del contenido. No uses comillas, ni saludos.
      Ejemplo: "El cerebro humano genera unos 12-25 vatios de electricidad, suficiente para encender una bombilla LED."
    `;

    const completion = await groq.chat.completions.create({
      // 4. CORRECCIÓN: Usamos un modelo válido y rápido de Groq
      model: "llama3-70b-8192", 
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.9, 
      max_tokens: 100, // Limitamos para asegurar brevedad
    });

    const content = completion.choices[0]?.message?.content || "El descanso es vital para tu mente.";
    
    return NextResponse.json({ content });

  } catch (error) {
    console.error('[DAILY_CONTENT_API_ERROR]', error);
    // En caso de error, devolvemos una frase genérica para no romper el widget
    return NextResponse.json({ content: "Recuerda tomar pausas activas para oxigenar tu cerebro." });
  }
}