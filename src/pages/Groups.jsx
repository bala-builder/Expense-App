import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useApp } from '../context/AppContext'
import CreateGroupModal from '../components/CreateGroupModal'

export default function Groups() {
    const { groups } = useApp()
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Your Groups</h1>
                <Button onClick={() => setIsCreateGroupOpen(true)}>
                    <Plus size={18} className="mr-2" />
                    Create Group
                </Button>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Users size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No groups yet</h3>
                    <p className="text-secondary mt-1 mb-4">Create a group to start sharing expenses.</p>
                    <Button onClick={() => setIsCreateGroupOpen(true)}>Create Group</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Link key={group.id} to={`/groups/${group.id}`}>
                            <div className="bg-surface p-6 rounded-xl shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {group.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                                        Active
                                    </span>
                                </div>
                                <h3 className="font-semibold text-slate-900">{group.name}</h3>
                                <div className="flex items-center gap-2 mt-2 text-sm text-secondary">
                                    <Users size={16} />
                                    <span>{group.members.length} members</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
        </div>
    )
}
