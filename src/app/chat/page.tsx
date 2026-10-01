import Chat from '@/components/Chat';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            CF
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">CodeFox</h1>
            <p className="text-[11px] text-gray-500">Mentor de programación</p>
          </div>
        </div>
        <span className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
          Historial guardado
        </span>
      </header>
      <Chat projectName="Mi proyecto" />
    </div>
  );
}
