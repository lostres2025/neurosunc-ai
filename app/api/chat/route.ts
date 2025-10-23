import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ message: 'El mensaje es requerido.' }, { status: 400 });
    }
    
    const systemPrompt = `
      Eres "NeuroSync Coach", un asistente de IA experto en neurociencia y bienestar cognitivo. 
      Tu objetivo es ayudar al usuario a entender y mejorar su rendimiento mental.
      - Sé conciso, amigable y motivador.
      - Da consejos prácticos y basados en ciencia.
      - Nunca des consejos médicos.
      - Tus respuestas deben ser breves (máximo 2-3 frases).
    `;

    const completion = await groq.chat.completions.create({
      // --- Usamos el modelo que verificaste en el Playground ---
      model: "openai/gpt-oss-20b", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    
    return NextResponse.json({ reply });

  } catch (error) {
    console.error('[CHAT_API_ERROR_GROQ]', error);
    return NextResponse.json({ message: 'Error al contactar con el Coach de IA.' }, { status: 500 });
  }
}