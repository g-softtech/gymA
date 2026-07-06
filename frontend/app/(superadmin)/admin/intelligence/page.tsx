import IntelligenceTabs from "./IntelligenceTabs";

export default function IntelligencePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Intelligence Operations Console
        </h1>
        <p className="text-sm text-gray-400">
          System health, ML performance, and execution observability
        </p>
      </div>

      <IntelligenceTabs />
    </div>
  );
}
