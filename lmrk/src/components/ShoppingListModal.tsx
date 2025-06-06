import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// More saturated pastel colors
const COLORS = [
  "#fff", "#ffb3c6", "#fff799",
  "#7fffd4", "#a5b4fc", "#e9aaff"
];

function formatDate(date: Date | string) {
  if (typeof date === "string") return date;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, " ");
}

type ShoppingListItem = {
  name: string;
  quantity: string;
  checked: boolean;
  _id?: string;
};

type ShoppingListModalProps = {
  open: boolean;
  onClose: () => void;
  initialData?: {
    name?: string;
    color?: string;
    dateCreated?: string;
    items?: ShoppingListItem[];
  };
  onSave?: (data: any) => void;
  isEdit?: boolean;
};

export default function ShoppingListModal({
  open,
  onClose,
  initialData,
  onSave,
  isEdit,
}: ShoppingListModalProps) {
  const [color, setColor] = useState(COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [name, setName] = useState("");
  const [dateCreated, setDateCreated] = useState(formatDate(new Date()));
  const [items, setItems] = useState<ShoppingListItem[]>([{ name: "", quantity: "", checked: false }]);
  const router = useRouter();
  const { update } = useSession();

  // Prefill fields in edit mode, or reset for new list
  useEffect(() => {
    if (open) {
      if (initialData) {
        setColor(initialData.color || COLORS[0]);
        setName(initialData.name || "");
        setDateCreated(formatDate(initialData.dateCreated || new Date()));
        setItems(
          Array.isArray(initialData.items) && initialData.items.length > 0
            ? initialData.items.map((item: any) => ({
                name: item.name || "",
                quantity: item.quantity || "",
                checked: !!item.checked,
                _id: item._id,
              }))
            : [{ name: "", quantity: "", checked: false }]
        );
      } else {
        setColor(COLORS[0]);
        setName("");
        setDateCreated(formatDate(new Date()));
        setItems([{ name: "", quantity: "", checked: false }]);
      }
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleItemChange = (idx: number, field: string, value: string | boolean) => {
    setItems(items =>
      items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    );
  };

  const handleAddItem = () => {
    setItems(items => [...items, { name: "", quantity: "", checked: false }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items => items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = {
      name,
      color,
      dateCreated,
      items,
    };
    if (isEdit && onSave) {
      await onSave(payload);
      onClose();
    } else {
      const res = await fetch("/api/shopping-lists/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await update();
        onClose();
        router.push("/shopping-lists");
      } else {
        alert("Failed to save shopping list.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-purple-700 text-3xl"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>
        <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex flex-col items-center relative">
              <button
                type="button"
                className="rounded-full w-14 h-14 border-2 border-gray-200 flex items-center justify-center"
                style={{ background: color }}
                onClick={() => setShowColorPicker(v => !v)}
                aria-label="Select color"
              />
              <span className="text-xs text-gray-500 mt-1">Select color</span>
              {showColorPicker && (
                <div className="absolute mt-2 bg-white border rounded-lg shadow-lg p-4 grid grid-cols-3 gap-6 z-50 left-1/2 -translate-x-1/2 min-w-[160px]">
                  {COLORS.map((c, idx) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-10 h-10 rounded-full border-2 ${color === c ? "border-purple-700" : "border-gray-200"}`}
                      style={{ background: c }}
                      onClick={() => { setColor(c); setShowColorPicker(false); }}
                    />
                  ))}
                </div>
              )}
            </div>
            <input
              className="flex-1 text-2xl font-bold border-b-2 border-purple-200 focus:border-purple-700 outline-none px-2 py-1"
              placeholder="List name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-2 text-xs text-gray-500">{dateCreated}</div>
          <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-3 pb-8">
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Items:</h3>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item._id || idx} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded p-1 text-sm"
                      placeholder="Item name"
                      value={item.name}
                      onChange={e => handleItemChange(idx, "name", e.target.value)}
                      required
                    />
                    <input
                      className="w-20 border rounded p-1 text-sm"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, "quantity", e.target.value)}
                    />
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-red-500"
                      onClick={() => handleRemoveItem(idx)}
                      aria-label="Delete item"
                      disabled={items.length === 1}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-purple-700 hover:underline text-sm"
                onClick={handleAddItem}
              >
                Add another item
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="bg-purple-700 text-white px-6 py-2 rounded font-semibold hover:bg-purple-800 transition text-base"
            >
              Save List
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
