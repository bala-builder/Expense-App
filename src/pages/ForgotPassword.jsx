import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useApp } from '../context/AppContext'

export default function ForgotPassword() {
    const { resetPassword } = useApp()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await resetPassword(email)
            setSuccess(true)
        } catch (err) {
            console.error(err)
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.')
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.')
            } else {
                setError('Failed to send reset email. ' + err.message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-lg border border-slate-100">
                <div className="text-center">
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-secondary">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                {success ? (
                    <div className="mt-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-slate-900">Check your email</h3>
                            <p className="text-sm text-secondary">
                                We sent a password reset link to <span className="font-semibold">{email}</span>
                            </p>
                        </div>
                        <Button asChild className="w-full" variant="outline">
                            <Link to="/login">
                                Back to Sign in
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <Input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="pl-10"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending link...' : 'Send Reset Link'}
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary">
                                <ArrowLeft size={16} className="mr-2" />
                                Back to Sign in
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
