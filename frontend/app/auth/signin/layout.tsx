import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ReactNode } from "react";

export default async function SignInLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();

  // If the user is already signed in, prevent them from seeing the sign-in page again
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
