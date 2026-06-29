import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MemberWorkoutsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      workouts: {
        include: {
          trainer: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!memberProfile) return null;

  const workouts = memberProfile?.workouts ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Workout Plans</h1>
        <p className="text-muted-foreground mt-1">
          {workouts.length} plan{workouts.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">💪</p>
          <p className="font-medium text-muted-foreground">No workout plans yet</p>
          <p className="text-sm mt-1">Your trainer will assign workout plans here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => {
            const routines = w.routines as {
              day: string;
              exercises: { name: string; sets: number; reps: string; rest: string }[];
            }[];
            return (
              <div key={w.id} className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{w.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {w.trainer
                        ? `Assigned by ${w.trainer.user.name ?? "Your Trainer"}`
                        : "Self-assigned"}
                      {" · "}
                      {new Date(w.createdAt).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {w.isAiGenerated && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                        🤖 AI Generated
                      </span>
                    )}
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
                      {routines.length} training day{routines.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {routines.map((r, i) => (
                    <div key={i} className="bg-muted rounded-lg p-4">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">
                        {r.day}
                      </p>
                      <ul className="space-y-2">
                        {r.exercises.map((ex, j) => (
                          <li key={j} className="text-sm">
                            <p className="font-medium text-foreground">{ex.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ex.sets} sets &times; {ex.reps} reps &middot; {ex.rest} rest
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
