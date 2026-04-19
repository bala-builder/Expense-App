import { useState } from 'react'
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { LogOut, User, Menu, Users } from 'lucide-react'
import { Button } from './ui/button'
import { useApp } from '../context/AppContext'
import Login from '../pages/Login'

export default function Layout() {
    const { user, logout } = useApp()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const location = useLocation()

    // Close mobile menu when route changes
    if (isMobileMenuOpen && location.pathname) {
        // This logic is handled by Link onClick for now, but good to have if we add other navigation
    }

    if (!user) {
        return <Login />
    }

    if (!user.emailVerified) {
        return <Navigate to="/verify-email" />
    }

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
                        <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-primary">
                            Dashboard
                        </Link>
                        <Link to="/groups" className="text-sm font-medium text-slate-600 hover:text-primary">
                            Groups
                        </Link>
                        <Link to="/activity" className="text-sm font-medium text-slate-600 hover:text-primary">
                            Activity
                        </Link>
                        <Link to="/friends" className="text-sm font-medium text-slate-600 hover:text-primary">
                            Friends
                        </Link>
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
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</p>
                                    </div>
                                    <div className="py-1">
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
                {
                    isMobileMenuOpen && (
                        <div className="md:hidden border-t border-slate-200 bg-surface px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2">
                            <nav className="flex flex-col gap-4">
                                <Link
                                    to="/dashboard"
                                    className="text-sm font-medium text-slate-600 hover:text-primary py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/friends"
                                    className="text-sm font-medium text-slate-600 hover:text-primary py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Friends
                                </Link>
                                <Link
                                    to="/groups"
                                    className="text-sm font-medium text-slate-600 hover:text-primary py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Groups
                                </Link>
                                <Link
                                    to="/activity"
                                    className="text-sm font-medium text-slate-600 hover:text-primary py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Activity
                                </Link>
                            </nav>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User size={18} />
                                    </div>
                                    <span className="inline">{user.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-600">
                                    <LogOut size={18} />
                                </Button>
                            </div>
                        </div>
                    )
                }
            </header >

            <main className="flex-1 container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div >
    )
}
