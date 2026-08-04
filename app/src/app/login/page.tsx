import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/orders");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="Sadovsky" width={220} height={70} priority />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h1 className="mb-1 text-center text-xl font-bold text-brand">
            אייכות ובקלות
          </h1>
          <p className="mb-6 text-center text-sm text-zinc-500">
            הזינו את הקוד האישי בן 9 הספרות
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
