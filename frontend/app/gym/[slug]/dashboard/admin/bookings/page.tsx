import BookingManager from "@/components/admin/BookingManager";

export const metadata = {
  title: "Bookings | Admin Dashboard",
};

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bookings & Schedule
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage group classes and 1-on-1 trainer sessions.
          </p>
        </div>
      </div>

      <BookingManager />
    </div>
  );
}
