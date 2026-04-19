import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useApp } from '../context/AppContext'

export default function CreateGroupModal({ isOpen, onClose }) {
    const { addGroup } = useApp()
    const [groupName, setGroupName] = useState('')
    const [emails, setEmails] = useState([''])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        addGroup(groupName, emails.filter(e => e))
        onClose()
        setGroupName('')
        setEmails([''])
    }

    const addEmailField = () => setEmails([...emails, ''])

    const handleEmailChange = (index, value) => {
        const newEmails = [...emails]
        newEmails[index] = value
        setEmails(newEmails)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-surface rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Create New Group</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={18} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Group Name</label>
                        <Input
                            placeholder="e.g., Summer Trip, Apartment 4B"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Invite Members (Optional)</label>
                        {emails.map((email, index) => (
                            <Input
                                key={index}
                                placeholder="friend@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                className="mb-2"
                            />
                        ))}
                        <Button type="button" variant="ghost" size="sm" onClick={addEmailField} className="text-primary gap-1">
                            <Plus size={14} /> Add another person
                        </Button>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Create Group</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
