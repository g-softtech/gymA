import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import BlogEditor from "@/components/admin/BlogEditor";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const session = await getAuthSession();

  if (!session?.user) return null;
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect(`/gym/${slug}/dashboard/admin`);
  }

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      tags: true,
      published: true,
      publishedAt: true,
    },
  });

  if (!post) notFound();

  return (
    <BlogEditor
      mode="edit"
      initial={{
        id: post.id,
        title: post.title,
        excerpt: post.excerpt ?? "",
        content: post.content,
        coverImage: post.coverImage ?? "",
        tags: post.tags as unknown as string,
        published: post.published,
      }}
    />
  );
}
