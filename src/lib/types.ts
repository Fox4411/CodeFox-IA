export type AIMode = "plan" | "build" | "review" | "ship";

export interface ProjectFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  goal: string;
  files: ProjectFile[];
  checklist: { id: string; text: string; done: boolean }[];
  createdAt: number;
  updatedAt: number;
}

export const MODES: Record<AIMode, { label: string; description: string }> = {
  plan: {
    label: "Plan",
    description: "Definir objetivo, alcance y pasos"
  },
  build: {
    label: "Build",
    description: "Escribir y estructurar código"
  },
  review: {
    label: "Review",
    description: "Revisar calidad y errores"
  },
  ship: {
    label: "Ship",
    description: "Preparar para terminar y desplegar"
  }
};

export const TEMPLATES = [
  {
    id: "landing",
    name: "Landing Page",
    goal: "Landing page moderna para validar una idea",
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mi Producto</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white">
  <main class="min-h-screen flex flex-col items-center justify-center px-6">
    <h1 class="text-5xl font-bold tracking-tight mb-4">Tu producto aquí</h1>
    <p class="text-gray-400 text-lg mb-8 max-w-xl text-center">
      Describe el valor principal en una frase clara.
    </p>
    <button class="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition">
      Empezar
    </button>
  </main>
</body>
</html>`
      }
    ],
    checklist: [
      "Definir propuesta de valor",
      "Escribir titular y subtítulo",
      "Añadir sección de beneficios",
      "Añadir call to action claro",
      "Hacerla responsive"
    ]
  },
  {
    id: "saas",
    name: "SaaS Starter",
    goal: "Estructura base de un SaaS simple",
    files: [
      {
        name: "app.js",
        language: "javascript",
        content: `// SaaS Starter - lógica principal
const state = {
  user: null,
  features: []
};

function init() {
  console.log("SaaS starter listo");
  console.log("Siguiente: definir el core feature");
}

init();`
      },
      {
        name: "README.md",
        language: "markdown",
        content: `# SaaS Starter

## Objetivo
Definir y construir el core del producto.

## Stack sugerido
- Next.js
- Tailwind
- Supabase o similar

## Próximos pasos
1. Definir el problema exacto
2. Definir el usuario
3. Construir el flujo principal`
      }
    ],
    checklist: [
      "Definir el problema que resuelve",
      "Definir el usuario objetivo",
      "Definir el feature principal",
      "Diseñar el flujo mínimo",
      "Construir la primera versión usable"
    ]
  },
  {
    id: "blank",
    name: "Proyecto vacío",
    goal: "",
    files: [
      {
        name: "main.js",
        language: "javascript",
        content: `// Empieza aquí
console.log("Proyecto iniciado");
`
      }
    ],
    checklist: []
  }
];
