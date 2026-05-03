import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { CheckCircle2, Wallet, Users, PieChart } from 'lucide-react'

export default function Login() {
    const { login, register, signInWithGoogle, user } = useApp()
    const navigate = useNavigate()
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (isLogin) {
                await login(email, password)
            } else {
                await register(name, email, password)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setError('')
        setLoading(true)
        try {
            await signInWithGoogle()
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side: Pitch (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/3 bg-slate-900 text-white flex-col relative z-20">
                {/* Decorative background gradients (contained) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                </div>
                
                {/* Top Logo & Text Content */}
                <div className="relative z-10 px-12 lg:px-24 pt-16 pb-8 flex-1 flex flex-col justify-center">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-16">
                        <img src="/logo.png" alt="Trackcents Logo" className="h-10 w-auto" />
                        <span className="text-2xl font-bold tracking-tight text-white">Trackcents</span>
                    </div>

                    <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 leading-tight">
                        Track every cent, <br/>
                        <span className="text-primary-light">without the awkwardness.</span>
                    </h1>
                    <p className="text-slate-300 text-base lg:text-lg mb-10 max-w-md">
                        The simplest way to manage shared expenses, track balances, and settle up with friends and family.
                    </p>

                    <div className="space-y-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <Wallet className="text-primary-light" size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Track Expenses</h3>
                                <p className="text-sm text-slate-400">Log who paid what, instantly.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <Users className="text-primary-light" size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Create Groups</h3>
                                <p className="text-sm text-slate-400">Organize trips, apartments, and events.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <PieChart className="text-primary-light" size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Smart Balances</h3>
                                <p className="text-sm text-slate-400">See exactly who owes who, at a glance.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Center: Login/Signup Form */}
            <div className="w-full lg:w-1/3 flex items-center justify-center p-8 sm:p-12 bg-white relative z-30 shadow-2xl lg:shadow-[0_0_40px_rgba(0,0,0,0.05)] border-x border-slate-100">
                <div className="w-full max-w-sm xl:max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-6 lg:hidden">
                            <Wallet size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-slate-500">
                            {isLogin ? 'Enter your details to access your dashboard.' : 'Sign up to start tracking your expenses.'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-red-600"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                    className="py-6 rounded-xl"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="py-6 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="py-6 rounded-xl"
                            />
                        </div>

                        {isLogin && (
                            <div className="flex items-center justify-end">
                                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <Button type="submit" className="w-full py-6 rounded-xl text-md font-bold mt-2" disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </Button>

                        <div className="relative flex py-4 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">OR</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full py-6 rounded-xl font-semibold flex items-center justify-center gap-3 bg-white border-slate-200 hover:bg-slate-50 transition-colors"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                        >
                            {isLogin ? (
                                <>Don't have an account? <span className="font-bold text-primary">Sign up</span></>
                            ) : (
                                <>Already have an account? <span className="font-bold text-primary">Sign in</span></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Hero Illustration (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/3 bg-slate-50 flex-col relative items-center justify-center p-12 overflow-hidden z-10">
                {/* Decorative background element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 animate-in fade-in slide-in-from-right-8 duration-700">
                    <img src="/landing-hero.png" alt="Abstract finance illustration" className="w-full max-w-[400px] xl:max-w-[500px] h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
                </div>
            </div>
        </div>
    )
}
