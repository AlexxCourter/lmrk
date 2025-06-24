export default function AboutPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
        width: "100vw",
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-xl w-full flex flex-col items-center">
        <h1
          className="text-3xl font-bold mb-4 text-black"
          style={{ fontFamily: "'Bree Serif', serif" }}
        >
          About LMRK
        </h1>
        <p className="text-black text-lg mb-6 text-center">
          LMRK (List Manager and Recipe Keeper) is designed to help you organize your recipes and manage your shopping lists with ease. Our goal is to make meal planning and grocery shopping simple, efficient, and enjoyable.
        </p>
        <div className="w-full border-t border-purple-200 my-4" />
        <div className="text-black text-center">
            <h1
          className="text-3xl font-bold mb-4 text-black"
          style={{ fontFamily: "'Bree Serif', serif" }}
        >
          Meet the Developer
        </h1>
          <div className="font-bold text-xl mb-1">
            <a
              href="https://www.linkedin.com/in/alex-courter/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-700 hover:underline"
            >
              Alex Courter
            </a>
          </div>
          <div className="mb-1">Bachelor of Science in Applied Technology, BYU Idaho 2024</div>
          <div>Certified in Web Development and Computer Programming</div>
        </div>
      </div>
    </div>
  );
}
