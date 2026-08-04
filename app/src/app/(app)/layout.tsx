import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-2 bg-brand px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:py-5">
        <Link href="/orders" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Sadovsky"
            width={200}
            height={63}
            className="h-12 w-auto rounded bg-white px-2 py-1.5 sm:h-[4.5rem]"
          />
        </Link>
        <div className="flex-1 text-center text-sm font-bold sm:text-2xl">
          <span className="hidden sm:inline">סדובסקי - </span>
          אייכות ובקלות
        </div>
        <div className="flex items-center justify-between gap-3 text-sm sm:justify-end">
          <span className="opacity-90">{user.name}</span>
          <form action={logout}>
            <button className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">
              יציאה
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
