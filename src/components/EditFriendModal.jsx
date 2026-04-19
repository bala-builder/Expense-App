 import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useApp } from '../context/AppContext'

export default function EditFriendModal({ isOpen, onClose, friend }) {
    const { updateUser, user } = useApp()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (friend) {
            setName(friend.name)
            setEmail(friend.email)
        }
    }, [friend])

    if (!isOpen || !friend) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateUser(friend.id, { name })
            onClose()
        } catch (error) {
            console.error(error)
            alert("Failed to update friend. See console.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-surface rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Edit Friend</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={18} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <Input
                            value={email}
                            disabled
                            className="bg-slate-50 text-slate-500 cursor-not-allowed"
                            title="Email cannot be changed"
                        />
                        <p className="text-xs text-secondary">Email cannot be changed.</p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            <Save size={16} className="mr-2" />
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
