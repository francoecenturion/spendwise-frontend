export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6 animate-fade-in">
      <div className="w-16 h-16 bg-stone-900 dark:bg-stone-100 rounded-2xl flex items-center justify-center shadow-md">
        <span className="text-white dark:text-stone-900 font-bold text-2xl">SW</span>
      </div>
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Home</h1>
      <p className="text-stone-500 dark:text-stone-400 text-center text-sm">
        Próximamente: tu resumen financiero personal
      </p>
    </div>
  );
}
