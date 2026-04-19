import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Save, Trash2, UserMinus } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useApp } from '../context/AppContext'

export default function EditGroupModal({ isOpen, onClose, group, members }) {
    const { updateGroup, removeGroupMember, deleteGroup, user } = useApp()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (group) {
            setName(group.name)
        }
    }, [group])

    if (!isOpen || !group) return null

    const handleUpdateName = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateGroup(group.id, { name })
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveMember = async (memberId) => {
        if (window.confirm("Are you sure you want to remove this member?")) {
            try {
                await removeGroupMember(group.id, memberId)
            } catch (error) {
                console.error(error)
            }
        }
    }

    const handleDeleteGroup = async () => {
        if (window.confirm("ARE YOU SURE? This will permanently delete the group and all its expenses. This action cannot be undone.")) {
            setLoading(true)
            try {
                await deleteGroup(group.id)
                navigate('/dashboard')
            } catch (error) {
                console.error(error)
                alert("Failed to delete group")
                setLoading(false)
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-surface rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Edit Group</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={18} />
                    </Button>
                </div>

                <div className="p-4 space-y-6">
                    <form onSubmit={handleUpdateName} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Group Name</label>
                            <div className="flex gap-2">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <Button type="submit" disabled={loading || name === group.name}>
                                    <Save size={16} />
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-700">Members ({members.length})</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary font-bold border border-slate-100 text-xs">
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                            <p className="text-xs text-slate-500">{member.email}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-600 h-8 w-8"
                                        onClick={() => handleRemoveMember(member.id)}
                                        title="Remove member"
                                    >
                                        <UserMinus size={16} />
                                    </Button>
                                    {member.id === user.uid && (
                                        <span className="text-xs text-slate-400 px-2">You</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleDeleteGroup}
                            disabled={loading}
                        >
                            <Trash2 size={16} className="mr-2" />
                            Delete Group
                        </Button>
                        <p className="text-xs text-center text-slate-500 mt-2">
                            This will permanently delete the group and all its expenses.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
