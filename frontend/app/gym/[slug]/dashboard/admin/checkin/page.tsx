import { getAuthSession } from "@/lib/auth";

import { CheckInKiosk } from "@/components/admin/CheckInKiosk";

export default async function AdminCheckInPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();



  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Front Desk Check-In</h1>
        <p className="text-muted-foreground mt-1">Scan member access passes or search manually.</p>
      </div>

      <CheckInKiosk />
    </div>
  );
}
