import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../authOptions";
import { FaPlus } from "react-icons/fa";
import ToolsCards from "./ToolsCards";

function toPlainObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toPlainObject);
  }
  if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      if (key === "_id" && obj[key]?.toString) {
        newObj[key] = obj[key].toString();
      } else {
        newObj[key] = toPlainObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

export default async function ToolsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  // Use recipes and shoppingLists from session.user
  const recipes = toPlainObject(session.user?.recipes || []);
  const shoppingLists = toPlainObject(session.user?.shoppingLists || []);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col gap-8">
        <ToolsCards recipes={recipes} shoppingLists={shoppingLists} />
        {/* Spacer for floating menu */}
        <div style={{ height: 68 }} />
      </div>
    </div>
  );
}
