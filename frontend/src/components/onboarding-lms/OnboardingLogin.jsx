import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login as loginRequest } from '@/api/portal-onboarding.api';
import { setOnboardingToken } from '@/lib/onboardingPortalAuth';

export default function OnboardingLogin({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await loginRequest(email.trim());
      const { token, onboarding } = response.data;
      setOnboardingToken(token);
      onSuccess(onboarding);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center font-serif font-bold text-sm flex-shrink-0">
            M
          </div>
          <div>
            <div className="font-serif font-bold text-sm leading-tight">Myralix</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Onboarding LMS</div>
          </div>
        </div>

        <div className="border rounded-xl bg-card p-6">
          <h1 className="font-serif text-xl font-bold mb-1">Welcome</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter the email your recruiter used to reach you — no password needed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              )}
              {loading ? 'Signing in...' : 'Continue'}
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Trouble logging in? Contact your HR team.
        </p>
      </div>
    </div>
  );
}