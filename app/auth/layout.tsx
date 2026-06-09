import '../globals.css';

export const metadata = {
  title: 'SofStake - Authentication',
  description: 'Login or register to SofStake'
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="w-full max-w-lg px-4">
        {children}
      </div>
    </main>
  );
}
