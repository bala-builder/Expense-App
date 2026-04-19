import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useApp } from '../context/AppContext'

export default function VerifyEmail() {
    const { user, logout } = useApp()
    const [sending, setSending] = useState(false)
    const [message, setMessage] = useState('')

    // If not logged in, go to login
    if (!user) {
        return <Navigate to="/login" />
    }

    // If already verified, go to dashboard
    if (user.emailVerified) {
        return <Navigate to="/dashboard" />
    }

    const handleResend = async () => {
        setSending(true)
        setMessage('')
        try {
            await user.sendEmailVerification()
            setMessage('Verification email sent!')
        } catch (error) {
            console.error(error)
            setMessage('Error sending email. Try again later.')
        } finally {
            setSending(false)
        }
    }

    const handleRefresh = () => {
        window.location.reload()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
                <div className="bg-primary/5 p-6 text-center border-b border-sidebar-border/10">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
                    <p className="text-secondary mt-2">
                        We sent a verification link to <span className="font-semibold text-slate-900">{user.email}</span>
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <p className="text-sm text-center text-slate-600">
                            Click the link in the email to verify your account, then refresh this page.
                        </p>

                        {message && (
                            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg text-center font-medium">
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Button onClick={handleRefresh} className="w-full gap-2">
                            <RefreshCw size={18} />
                            I've Verified, Refresh
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleResend}
                            disabled={sending}
                            className="w-full"
                        >
                            {sending ? 'Sending...' : 'Resend Verification Email'}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={logout}
                            className="w-full text-slate-500 hover:text-red-600"
                        >
                            <LogOut size={18} className="mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
