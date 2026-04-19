import { useState } from 'react'
import { X, Copy, Check, Send } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useApp } from '../context/AppContext'

export default function InviteMemberModal({ isOpen, onClose, groupId, groupName }) {
    const { inviteToGroup } = useApp()
    const [copied, setCopied] = useState(false)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const inviteLink = `https://expense.balaconnect.com/invite/${encodeURIComponent(groupName?.toLowerCase().replace(/\s+/g, '-') || 'group')}`

    if (!isOpen) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSendInvite = async (e) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        try {
            await inviteToGroup(groupId, email, groupName)
            setSuccess(true)
            setEmail('')
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error(error)
            alert("Failed to send invitation")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Invite to {groupName}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={18} />
                    </Button>
                </div>

                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-700">Invite via Email</h3>
                        <form onSubmit={handleSendInvite} className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="friend@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1"
                                required
                            />
                            <Button type="submit" disabled={loading || !email}>
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {success ? <Check size={16} /> : <Send size={16} />}
                                        <span className="ml-2">Invite</span>
                                    </>
                                )}
                            </Button>
                        </form>
                        {success && (
                            <p className="text-xs text-green-600 font-medium">Invitation sent successfully!</p>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400 font-medium">Or share link</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">
                            Share this link with your friends so they can join this group.
                        </p>

                        <div className="flex gap-2">
                            <Input
                                value={inviteLink}
                                readOnly
                                className="bg-slate-50 font-mono text-xs text-slate-600 border-slate-200"
                            />
                            <Button onClick={handleCopy} size="icon" variant="outline" className="shrink-0">
                                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </Button>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button onClick={onClose} variant="ghost" className="text-slate-600">Close</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
