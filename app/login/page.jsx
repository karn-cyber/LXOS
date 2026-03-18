'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

function getLoginErrorMessage(errorCode) {
    switch (errorCode) {
        case 'CredentialsSignin':
            return 'Invalid email, password, or inactive account.';
        case 'AccessDenied':
            return 'You do not have permission to sign in.';
        case 'CallbackRouteError':
            return 'Sign in failed. Please check your credentials and try again.';
        default:
            return 'Unable to sign in right now. Please try again.';
    }
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(getLoginErrorMessage(result.error));
            } else if (!result?.ok) {
                setError('Sign in failed. Please verify your details and try again.');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('Network or server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center rounded-lg">
                            <Building2 className="h-6 w-6 text-white dark:text-zinc-900" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">LX Management Platform</CardTitle>
                    <CardDescription>
                        Learner Experience Operating System
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@lxos.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-2">
                            Demo Credentials:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg">
                                <div className="font-medium">Admin</div>
                                <div className="text-zinc-600 dark:text-zinc-400">admin@lxos.edu</div>
                            </div>
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg">
                                <div className="font-medium">LX Team</div>
                                <div className="text-zinc-600 dark:text-zinc-400">lx@lxos.edu</div>
                            </div>
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg">
                                <div className="font-medium">Club Head</div>
                                <div className="text-zinc-600 dark:text-zinc-400">clubhead@lxos.edu</div>
                            </div>
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg">
                                <div className="font-medium">Finance</div>
                                <div className="text-zinc-600 dark:text-zinc-400">finance@lxos.edu</div>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-2">
                            Password for all: admin123, lx123, club123, finance123
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
