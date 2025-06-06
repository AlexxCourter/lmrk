import { FaListUl, FaUtensils, FaShoppingCart, FaUserPlus, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex flex-col items-center min-h-screen w-full bg-gradient-to-br from-purple-800 to-purple-300 px-4 py-8">
      {/* App Title and Tagline */}
      <div className="mt-8 mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
          LMRK: List Manager & Recipe Keeper
        </h1>
        <p className="text-lg sm:text-xl text-purple-100 font-medium max-w-2xl mx-auto">
          Simplify shopping and meal planning by seamlessly integrating your recipes and shopping lists.
        </p>
        <div className="mt-2 text-xs text-purple-200 font-semibold tracking-widest uppercase">
          Alpha 1.0
        </div>
      </div>

      {/* Infographic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl my-8">
        {/* Recipes Card */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col items-center p-6 text-center">
          <FaUtensils className="text-4xl text-purple-700 mb-3" />
          <h2 className="text-xl font-bold mb-2 text-purple-800">Save & Organize Recipes</h2>
          <p className="text-gray-700 mb-2">
            Store your favorite recipes, add ingredients, and keep instructions handy for every meal.
          </p>
          <span className="inline-block text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
            Meal Planning
          </span>
        </div>
        {/* Shopping Lists Card */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col items-center p-6 text-center">
          <FaShoppingCart className="text-4xl text-purple-700 mb-3" />
          <h2 className="text-xl font-bold mb-2 text-purple-800">Smart Shopping Lists</h2>
          <p className="text-gray-700 mb-2">
            Create, edit, and manage shopping lists. Add recipe ingredients directly to your lists with one click.
          </p>
          <span className="inline-block text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
            Seamless Integration
          </span>
        </div>
        {/* Integration Card */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col items-center p-6 text-center">
          <FaListUl className="text-4xl text-purple-700 mb-3" />
          <h2 className="text-xl font-bold mb-2 text-purple-800">All-in-One Organizer</h2>
          <p className="text-gray-700 mb-2">
            Effortlessly switch between meal planning and shopping. LMRK keeps everything in sync for you.
          </p>
          <span className="inline-block text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
            Simplified Life
          </span>
        </div>
      </div>

      {/* Development Status */}
      <div className="flex items-center gap-2 mb-8">
        <FaCheckCircle className="text-green-500" />
        <span className="text-sm text-white font-medium">
          Currently in <span className="font-bold">Alpha 1.0</span> — Features and design are evolving!
        </span>
      </div>

      {/* Call to Action */}
      <Link
        href="/log-in"
        className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg transition"
      >
        <FaUserPlus className="text-xl" />
        Create Your Free Account
      </Link>
    </section>
  );
}
