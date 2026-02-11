import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shell, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/verify')
                .then(() => {
                    navigate('/', { replace: true });
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setCheckingAuth(false);
                });
        } else {
            setCheckingAuth(false);
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            navigate('/', { replace: true });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error.response?.data?.error || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(197, 25%, 14%)' }}>
                <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'hsl(197, 25%, 14%)' }}>
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.04]"
                    style={{ background: 'hsl(197, 27%, 47%)' }}
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.03]"
                    style={{ background: 'hsl(197, 27%, 60%)' }}
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [360, 180, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.02]"
                    style={{ background: 'radial-gradient(circle, hsl(197, 27%, 47%), transparent)' }}
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Login card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div
                    className="rounded-2xl p-8 shadow-2xl border"
                    style={{
                        background: 'hsl(197, 25%, 18%)',
                        borderColor: 'hsl(197, 20%, 25%)',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    {/* Logo / Branding */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-8"
                    >
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{
                                background: 'linear-gradient(135deg, hsl(197, 27%, 47%), hsl(197, 27%, 35%))',
                                boxShadow: '0 8px 25px rgba(88, 134, 154, 0.3)',
                            }}
                        >
                            <Shell className="h-8 w-8 text-white" />
                        </div>
                        <h1
                            className="text-2xl font-bold tracking-tight"
                            style={{ color: 'hsl(197, 15%, 92%)' }}
                        >
                            Oysterponds Shellfish
                        </h1>
                        <p
                            className="text-sm mt-1"
                            style={{ color: 'hsl(197, 15%, 55%)' }}
                        >
                            Invoice Management System
                        </p>
                    </motion.div>

                    {/* Error message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-3 rounded-lg flex items-center gap-2 text-sm"
                            style={{
                                background: 'hsla(0, 84%, 60%, 0.1)',
                                border: '1px solid hsla(0, 84%, 60%, 0.2)',
                                color: 'hsl(0, 84%, 70%)',
                            }}
                        >
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Login form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Label
                                htmlFor="email"
                                className="text-sm font-medium mb-2 block"
                                style={{ color: 'hsl(197, 15%, 70%)' }}
                            >
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                    style={{ color: 'hsl(197, 15%, 45%)' }}
                                />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@oysterponds.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-11 rounded-lg border text-sm transition-all duration-200"
                                    style={{
                                        background: 'hsl(197, 25%, 14%)',
                                        borderColor: 'hsl(197, 20%, 25%)',
                                        color: 'hsl(197, 15%, 92%)',
                                    }}
                                    disabled={loading}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Label
                                htmlFor="password"
                                className="text-sm font-medium mb-2 block"
                                style={{ color: 'hsl(197, 15%, 70%)' }}
                            >
                                Password
                            </Label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                    style={{ color: 'hsl(197, 15%, 45%)' }}
                                />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 pr-10 h-11 rounded-lg border text-sm transition-all duration-200"
                                    style={{
                                        background: 'hsl(197, 25%, 14%)',
                                        borderColor: 'hsl(197, 20%, 25%)',
                                        color: 'hsl(197, 15%, 92%)',
                                    }}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
                                    style={{ color: 'hsl(197, 15%, 45%)' }}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Button
                                type="submit"
                                disabled={loading || !email || !password}
                                className="w-full h-11 rounded-lg text-sm font-semibold transition-all duration-300 text-white"
                                style={{
                                    background: loading
                                        ? 'hsl(197, 20%, 35%)'
                                        : 'linear-gradient(135deg, hsl(197, 27%, 47%), hsl(197, 27%, 38%))',
                                    boxShadow: loading ? 'none' : '0 4px 15px rgba(88, 134, 154, 0.3)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </motion.div>
                    </form>
                </div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center mt-6 text-xs"
                    style={{ color: 'hsl(197, 15%, 35%)' }}
                >
                    Oysterponds Shellfish Co. &copy; {new Date().getFullYear()}
                </motion.p>
            </motion.div>
        </div>
    );
}
