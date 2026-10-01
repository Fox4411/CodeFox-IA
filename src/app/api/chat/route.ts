import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 60;

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const {
      messages,
      mode,
      projectName,
      projectGoal,
      currentFile,
      fileContent,
      checklist,
      fileList,
    } = await req.json();

    if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'Falta OPENAI_API_KEY en .env.local' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const modeInstructions: Record<string, string> = {
      plan: `MODO PLAN.
Ayuda a definir el producto con claridad:
- problema
- usuario
- MVP
- estructura de archivos recomendada
- orden de construcción
Puedes proponer estructura de proyecto. No generes demasiado código todavía.`,
      build: `MODO BUILD.
Construye. Genera código completo y usable.
Si el usuario pide una app/página/feature, entrega archivos completos.
Cuando crees un archivo nuevo, usa este formato exacto en el bloque:

\`\`\`html
<!-- file: index.html -->
...código...
\`\`\`

o

\`\`\`javascript
// file: app.js
...código...
\`\`\`

Así el usuario puede crear/aplicar ese archivo con un click.`,
      review: `MODO REVIEW.
Revisa arquitectura, claridad, errores y lo que falta para que funcione.
Si hay que corregir, entrega el archivo completo corregido con el formato file: nombre.`,
      ship: `MODO SHIP.
Enfócate en terminar:
- qué falta
- qué cortar
- cómo dejarlo demostrable o desplegable
Empuja a cerrar el MVP.`,
    };

    const filesText = Array.isArray(fileList) && fileList.length
      ? fileList.join(', ')
      : 'Sin archivos';

    const checklistText = Array.isArray(checklist) && checklist.length
      ? checklist.map((c: any) => `- [${c.done ? 'x' : ' '}] ${c.text}`).join('\n')
      : 'Sin checklist';

    const system = `Eres CodeFox, un co-builder de software.
Tu trabajo es ayudar a pasar de idea → estructura → código → proyecto terminable.

No eres un chatbot genérico. Eres un compañero de construcción.
Hablas en español latino, directo y profesional.

${modeInstructions[mode] || modeInstructions.build}

Capacidades que debes usar:
- Proponer estructura de proyecto completa
- Crear múltiples archivos (usando el formato file: nombre.ext)
- Escribir código completo, no fragmentos incompletos
- Guiar el orden de implementación
- Ayudar a terminar, no solo a empezar

Reglas de código:
- Para web simple: HTML + CSS + JS de navegador (sin require/import de Node)
- Si el usuario pide React/Next, explica estructura y genera código de componentes, pero avisa limitaciones del runtime actual
- Cada archivo importante debe ir en su propio bloque con comentario/header file: nombre
- Código listo para pegar y usar

Al final de CADA respuesta:
**Siguiente paso:** (una sola acción concreta)

Contexto:
- Proyecto: ${projectName || 'Sin nombre'}
- Objetivo: ${projectGoal || 'No definido'}
- Archivos del proyecto: ${filesText}
- Archivo abierto: ${currentFile || 'Ninguno'}
- Checklist:
${checklistText}

${fileContent ? `Contenido del archivo abierto:\n\`\`\`\n${String(fileContent).slice(0, 2800)}\n\`\`\`` : ''}`;

    const result = streamText({
      model: groq('openai/gpt-oss-20b'),
      system,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
