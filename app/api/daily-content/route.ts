// app/api/daily-content/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Array de temas para darle variedad a la IA
const themes = [
  'un dato curioso sobre la memoria',
  'un consejo práctico para mejorar la concentración',
  'un micro-ejercicio de mindfulness de menos de 1 minuto',
  'una cita inspiradora sobre el aprendizaje y la mente',
  'una explicación simple sobre cómo el sueño afecta al cerebro',
];

export async function GET() {
  try {
    // Seleccionamos un tema al azar
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const systemPrompt = `
      Eres "NeuroSync Coach". Tu tarea es generar una "píldora cognitiva" del día.
      Debe ser un contenido muy breve (1-2 frases), interesante y fácil de entender.
      El tema de hoy es: "${randomTheme}".
      Tu respuesta debe ser solo el texto del contenido, sin saludos ni despedidas.
      Ejemplo si el tema es "un dato curioso": "El cerebro humano genera unos 12-25 vatios de electricidad, suficiente para encender una bombilla LED de bajo consumo."
    `;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // Modelo rápido para contenido breve
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.9, // Aumentamos la creatividad
    });

    const content = completion.choices[0].message.content;
    
    return NextResponse.json({ content });

  } catch (error) {
    console.error('[DAILY_CONTENT_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar el contenido del día.' }, { status: 500 });
  }
}