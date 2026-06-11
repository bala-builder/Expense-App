import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { LogOut, User, Menu, Bell, BellOff, BellRing, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { useApp } from '../context/AppContext'
import { getNotificationStatus, registerForPushNotifications } from '../lib/notifications'
import Login from '../pages/Login'

export default function Layout() {
    const { user, logout } = useApp()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [notifStatus, setNotifStatus] = useState(null)
    const [enablingNotif, setEnablingNotif] = useState(false)
    const [bannerState, setBannerState] = useState('idle') // idle | loading | success | error
    const [bannerError, setBannerError] = useState('')
    // Only hide the banner for this session if dismissed — reshow on reload until actually granted
    const [sessionDismissed, setSessionDismissed] = useState(false)
    const location = useLocation()

    useEffect(() => {
        getNotificationStatus().then(setNotifStatus)
    }, [])

    const handleEnableNotifications = async () => {
        setBannerState('loading')
        setBannerError('')
        try {
            const success = await registerForPushNotifications(user.uid)
            const status = await getNotificationStatus()
            setNotifStatus(status)
            if (success && status === 'granted') {
                setBannerState('success')
                setTimeout(() => setSessionDismissed(true), 2000)
            } else if (status === 'denied') {
                setBannerState('error')
                setBannerError('Permission was denied. See instructions below.')
            } else {
                setBannerState('error')
                setBannerError('Could not register — try reloading the page and tapping Enable again.')
            }
        } catch (e) {
            setBannerState('error')
            setBannerError(e.message || 'Something went wrong.')
        }
    }

    const showBanner = !sessionDismissed && notifStatus !== null && notifStatus !== 'granted' && notifStatus !== 'unsupported'

    if (!user) return <Login />
    if (!user.emailVerified) return <Navigate to="/verify-email" />

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="bg-surface border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu size={20} />
                        </Button>
                        <Link to="/dashboard" className="text-xl font-bold text-primary flex items-center gap-2">
                            <img src="/logo.png" alt="Trackcents Logo" className="w-8 h-8 object-contain" />
                            <span>Trackcents</span>
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-primary">Dashboard</Link>
                        <Link to="/groups" className="text-sm font-medium text-slate-600 hover:text-primary">Groups</Link>
                        <Link to="/activity" className="text-sm font-medium text-slate-600 hover:text-primary">Activity</Link>
                        <Link to="/friends" className="text-sm font-medium text-slate-600 hover:text-primary">Friends</Link>
                        {import.meta.env.DEV && (
                            <Link to="/import" className="text-sm font-medium text-slate-600 hover:text-primary">Import Data</Link>
                        )}
                    </nav>

                    <div className="relative">
                        <button
                            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors focus:outline-none"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User size={18} />
                            </div>
                            <span className="hidden sm:inline">{user.name}</span>
                        </button>

                        {isProfileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</p>
                                    </div>
                                    <div className="py-1">
                                        {notifStatus === 'granted' ? (
                                            <div className="px-4 py-2 text-sm text-green-600 flex items-center gap-2">
                                                <BellRing size={16} />
                                                Notifications on
                                            </div>
                                        ) : notifStatus === 'denied' ? (
                                            <div className="px-4 py-2 text-sm text-slate-400 flex items-center gap-2">
                                                <BellOff size={16} />
                                                Notifications blocked
                                            </div>
                                        ) : notifStatus === 'default' ? (
                                            <button
                                                onClick={handleEnableNotifications}
                                                disabled={enablingNotif}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Bell size={16} />
                                                {enablingNotif ? 'Enabling...' : 'Enable notifications'}
                                            </button>
                                        ) : null}
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-surface px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2">
                        <nav className="flex flex-col gap-4">
                            <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-primary py-2" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                            <Link to="/friends" className="text-sm font-medium text-slate-600 hover:text-primary py-2" onClick={() => setIsMobileMenuOpen(false)}>Friends</Link>
                            <Link to="/groups" className="text-sm font-medium text-slate-600 hover:text-primary py-2" onClick={() => setIsMobileMenuOpen(false)}>Groups</Link>
                            <Link to="/activity" className="text-sm font-medium text-slate-600 hover:text-primary py-2" onClick={() => setIsMobileMenuOpen(false)}>Activity</Link>
                            {import.meta.env.DEV && (
                                <Link to="/import" className="text-sm font-medium text-slate-600 hover:text-primary py-2" onClick={() => setIsMobileMenuOpen(false)}>Import Data</Link>
                            )}
                        </nav>
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User size={18} />
                                </div>
                                <span>{user.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-600">
                                <LogOut size={18} />
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            {/* Notification permission banner */}
            {showBanner && (
                <div className={`w-full px-4 py-3 text-sm ${
                    bannerState === 'success' ? 'bg-green-600 text-white' :
                    bannerState === 'error' || notifStatus === 'denied' ? 'bg-amber-50 border-b border-amber-200 text-amber-800' :
                    'bg-primary text-white'
                }`}>
                    {bannerState === 'success' ? (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <span className="font-medium">Notifications enabled! You'll be alerted when expenses are added.</span>
                        </div>
                    ) : bannerState === 'error' || notifStatus === 'denied' ? (
                        <div className="space-y-1">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Notifications are blocked</p>
                                        {bannerError && <p className="text-xs mt-0.5 opacity-80">{bannerError}</p>}
                                        <p className="text-xs mt-1 opacity-80">
                                            On your phone: open Chrome → tap the <strong>lock icon</strong> in the address bar → <strong>Site settings</strong> → <strong>Notifications</strong> → <strong>Allow</strong>. Then reload this page.
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSessionDismissed(true)} className="shrink-0 opacity-60 hover:opacity-100 p-0.5">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Bell size={16} className="shrink-0" />
                                <span>Enable notifications to get alerted when expenses are added.</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={handleEnableNotifications}
                                    disabled={bannerState === 'loading'}
                                    className="font-semibold underline underline-offset-2 disabled:opacity-60 whitespace-nowrap"
                                >
                                    {bannerState === 'loading' ? 'Enabling…' : 'Enable'}
                                </button>
                                <button onClick={() => setSessionDismissed(true)} className="opacity-70 hover:opacity-100 p-0.5">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <main className="flex-1 container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}
