import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth'; // 1. Importamos la seguridad

// Configuración de Groq
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Función para generar el prompt específico
const getSystemPrompt = (gameType: string, score: number, level: number): string => {
  const basePrompt = `
    Eres "NeuroSync Coach", un asistente de IA experto en análisis de rendimiento cognitivo. 
    Un usuario acaba de terminar una partida. Tu tarea es darle un feedback breve (máximo 2 frases), 
    positivo y un consejo accionable para la próxima vez. No uses emojis.
    Sé específico y motivador.
  `;

  if (gameType === 'MEMORY_WORK') {
    return `${basePrompt}
      El juego era de "Memoria de Trabajo" (repetir una secuencia de cuadros).
      El usuario alcanzó el nivel ${level} con una puntuación de ${score}.
      Analiza este resultado. Si el nivel es bajo (1-3), enfócate en la concentración. 
      Si es medio (4-6), sugiere técnicas de "chunking" (agrupar números). 
      Si es alto (7+), felicítalo por su impresionante capacidad de memoria.
      Ejemplo de respuesta: "¡Gran esfuerzo! Noté que tu precisión es excelente. Para el siguiente nivel, intenta agrupar los primeros 3 cuadros como un solo 'número' mental."
    `;
  }

  if (gameType === 'ATTENTION_STROOP') {
    return `${basePrompt}
      El juego era de "Atención Selectiva" (Test de Stroop: decir el color de la tinta, no la palabra).
      El usuario obtuvo una puntuación de ${score} en 60 segundos.
      Analiza este resultado. Una puntuación baja (<100) indica dificultad para inhibir la respuesta automática.
      Una puntuación media (100-180) es buena. Una puntuación alta (180+) es excelente.
      Sugiere técnicas como respirar hondo antes de cada respuesta o enfocarse solo en la forma de las letras.
      Ejemplo de respuesta: "¡Excelente velocidad! Lograste suprimir bien el impulso de leer. Para mejorar aún más, prueba a entrecerrar los ojos ligeramente para desenfocar la palabra."
    `;
  }

  return basePrompt;
};

export async function POST(request: Request) {
  try {
    // 2. SEGURIDAD: Verificar sesión
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }

    const { gameType, score, level } = await request.json();

    if (!gameType || score === undefined || level === undefined) {
      return NextResponse.json({ message: 'Faltan datos de la partida.' }, { status: 400 });
    }

    const systemPrompt = getSystemPrompt(gameType, score, level);

    // 3. LLAMADA A GROQ (Modelo Corregido)
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Modelo correcto y rápido
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Analiza mi partida y dame feedback." }, 
      ],
      temperature: 0.7,
      max_tokens: 150, // Limitamos la respuesta para que sea breve
    });

    const feedback = completion.choices[0]?.message?.content || "¡Buen trabajo! Sigue entrenando para mejorar.";
    
    return NextResponse.json({ feedback });

  } catch (error) {
    console.error('[GAME_FEEDBACK_API_ERROR]', error);
    // Devolvemos un mensaje genérico en caso de error para que el juego no se rompa
    return NextResponse.json({ feedback: "¡Bien jugado! Sigue así." }); 
  }
}