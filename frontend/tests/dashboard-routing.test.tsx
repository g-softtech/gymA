import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardRouter from "../app/dashboard/page";
import * as auth from "../lib/auth";
import { prisma } from "../lib/prisma";
import * as navigation from "next/navigation";

// Mock external dependencies
vi.mock("../lib/auth", () => ({
  getAuthSession: vi.fn(),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error("NEXT_REDIRECT:" + url);
  }),
}));

describe("Dashboard Routing Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects SUPERADMIN to /admin and never to onboarding", async () => {
    vi.mocked(auth.getAuthSession).mockResolvedValue({
      user: { id: "user1", role: "SUPERADMIN", tenantId: undefined },
      expires: "9999",
    });

    await expect(DashboardRouter()).rejects.toThrow("NEXT_REDIRECT:/admin");
    expect(navigation.redirect).toHaveBeenCalledWith("/admin");
    expect(navigation.redirect).not.toHaveBeenCalledWith("/onboarding");
  });

  it("redirects Gym Owner (ADMIN) with tenant to /gym/[slug]/dashboard/admin", async () => {
    vi.mocked(auth.getAuthSession).mockResolvedValue({
      user: { id: "user2", role: "ADMIN", tenantId: "tenant-1" },
      expires: "9999",
    });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ slug: "iron-gym" } as any);

    await expect(DashboardRouter()).rejects.toThrow("NEXT_REDIRECT:/gym/iron-gym/dashboard/admin");
    expect(navigation.redirect).toHaveBeenCalledWith("/gym/iron-gym/dashboard/admin");
    expect(navigation.redirect).not.toHaveBeenCalledWith("/onboarding");
  });

  it("redirects STAFF with tenant to /gym/[slug]/dashboard/staff", async () => {
    vi.mocked(auth.getAuthSession).mockResolvedValue({
      user: { id: "user3", role: "STAFF", tenantId: "tenant-1" },
      expires: "9999",
    });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ slug: "iron-gym" } as any);

    await expect(DashboardRouter()).rejects.toThrow("NEXT_REDIRECT:/gym/iron-gym/dashboard/staff");
    expect(navigation.redirect).toHaveBeenCalledWith("/gym/iron-gym/dashboard/staff");
  });

  it("redirects TRAINER with tenant to /gym/[slug]/dashboard/trainer", async () => {
    vi.mocked(auth.getAuthSession).mockResolvedValue({
      user: { id: "user4", role: "TRAINER", tenantId: "tenant-1" },
      expires: "9999",
    });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ slug: "iron-gym" } as any);

    await expect(DashboardRouter()).rejects.toThrow("NEXT_REDIRECT:/gym/iron-gym/dashboard/trainer");
    expect(navigation.redirect).toHaveBeenCalledWith("/gym/iron-gym/dashboard/trainer");
  });

  it("redirects MEMBER with tenant to /gym/[slug]/dashboard/member", async () => {
    vi.mocked(auth.getAuthSession).mockResolvedValue({
      user: { id: "user5", role: "MEMBER", tenantId: "tenant-1" },
      expires: "9999",
    });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ slug: "iron-gym" } as any);

    await expect(DashboardRouter()).rejects.toThrow("NEXT_REDIRECT:/gym/iron-gym/dashboard/member");
    expect(navigation.redirect).toHaveBeenCalledWith("/gym/iron-gym/dashboard/member");
  });

  it("redirects authenticated user without tenant to /onboarding", async () => {
    vi.mocked(auth.getAuthSession).mockResolvedValue({
      user: { id: "user6", role: "MEMBER", tenantId: undefined },
      expires: "9999",
    });

    await expect(DashboardRouter()).rejects.toThrow("NEXT_REDIRECT:/onboarding");
    expect(navigation.redirect).toHaveBeenCalledWith("/onboarding");
  });
  
  it("redirects unauthenticated user to signin", async () => {
    vi.mocked(auth.getAuthSession).mockResolvedValue(null);

    await expect(DashboardRouter()).rejects.toThrow("NEXT_REDIRECT:/api/auth/signin?callbackUrl=/dashboard");
    expect(navigation.redirect).toHaveBeenCalledWith("/api/auth/signin?callbackUrl=/dashboard");
  });
});
