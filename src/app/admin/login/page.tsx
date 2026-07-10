import LoginForm from './LoginForm';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-extrabold text-blue-900">Acesso restrito</h1>
        <LoginForm next={next && next.startsWith('/admin') ? next : '/admin'} />
      </div>
    </main>
  );
}
