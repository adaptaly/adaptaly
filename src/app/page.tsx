export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-10">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
        Welcome to <span className="text-purple-600">Adaptaly</span>
      </h1>
      <p className="text-lg text-gray-600 text-center max-w-xl">
        An AI-powered platform that helps you learn the way your brain works best.  
        Built to adapt. Built for growth.
      </p>
      <div className="mt-6">
        <button className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition">
          Get Started
        </button>
      </div>
    </main>
  );
}