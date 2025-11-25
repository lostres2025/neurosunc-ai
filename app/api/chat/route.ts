import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth'; // Importamos la seguridad

// Configuración del cliente Groq usando la librería de OpenAI
// Asegúrate de tener: npm install openai
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY, // Recuerda poner esto en tu .env y en Vercel
});

export async function POST(request: Request) {
  try {
    // 1. SEGURIDAD: Verificar que el usuario esté logueado
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ reply: 'Por favor, inicia sesión para hablar conmigo.' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ message: 'El mensaje es requerido.' }, { status: 400 });
    }
    
    // 2. Prompt del Sistema (Personalidad)
    const systemPrompt = `
      Eres "NeuroSync Coach", un asistente de IA experto en neurociencia y bienestar cognitivo. 
      Tu objetivo es ayudar al usuario a entender y mejorar su rendimiento mental.
      - Sé conciso, amigable y motivador.
      - Da consejos prácticos y basados en ciencia.
      - Nunca des consejos médicos ni diagnósticos.
      - Tus respuestas deben ser breves (máximo 2-3 frases) para leer rápido en móvil.
    `;

    // 3. Llamada a la IA
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 300, // Limitamos para que no escriba testamentos
    });

    const reply = completion.choices[0]?.message?.content || "Lo siento, no pude pensar una respuesta.";
    
    return NextResponse.json({ reply });

  } catch (error) {
    console.error('[CHAT_API_ERROR_GROQ]', error);
    return NextResponse.json({ reply: 'Mi cerebro digital está desconectado temporalmente. Intenta más tarde.' }, { status: 500 });
  }
}