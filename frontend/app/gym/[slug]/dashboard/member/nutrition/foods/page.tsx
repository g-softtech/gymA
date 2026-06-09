import FoodDatabase from "@/components/member/FoodDatabase";

export default function FoodDatabasePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Food Database</h1>
        <p className="text-gray-500 mt-1">
          Nigerian and African foods with nutritional information
        </p>
      </div>
      <FoodDatabase />
    </div>
  );
}
