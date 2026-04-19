import { X, Users } from 'lucide-react'
import { Button } from './ui/button'

export default function SelectGroupModal({ isOpen, onClose, groups, onSelect }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-surface rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Select Group</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={18} />
                    </Button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {groups.length === 0 ? (
                        <div className="text-center py-8 text-secondary">
                            <p>No groups found.</p>
                        </div>
                    ) : (
                        groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => onSelect(group)}
                                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-100"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                    {group.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900">{group.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-secondary">
                                        <Users size={14} />
                                        <span>{group.members.length} members</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
