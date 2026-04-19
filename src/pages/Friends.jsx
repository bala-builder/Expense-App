import { useState } from 'react'
import { Users, Pencil } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/button'
import EditFriendModal from '../components/EditFriendModal'

export default function Friends() {
    const { getFriends, getFriendBalance } = useApp()
    const friends = getFriends()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [friendToEdit, setFriendToEdit] = useState(null)

    const handleEditClick = (friend) => {
        setFriendToEdit(friend)
        setIsEditOpen(true)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                    Friends
                </h1>
                <p className="text-secondary mt-2">
                    See who owes you and who you owe.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {friends.length > 0 ? (
                    friends.map(friend => {
                        const balance = getFriendBalance(friend.id)
                        return (
                            <div key={friend.id} className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
                                        <Users size={20} />
                                        <button
                                            onClick={() => handleEditClick(friend)}
                                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                            title="Edit Friend Detail"
                                        >
                                            <Pencil size={10} />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{friend.name}</h3>
                                        <p className="text-xs text-secondary">{friend.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-secondary mb-1">
                                        {balance > 0 ? 'owes you' : balance < 0 ? 'you owe' : 'settled'}
                                    </p>
                                    <p className={`font-bold ${balance > 0 ? 'text-green-600' :
                                        balance < 0 ? 'text-red-600' : 'text-slate-400'
                                        }`}>
                                        ${Math.abs(balance).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full text-center py-12 bg-surface/50 rounded-xl border border-dashed border-slate-200">
                        <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No friends yet</h3>
                        <p className="text-slate-500 mt-2">Join a group to start adding friends!</p>
                    </div>
                )}
            </div>

            <EditFriendModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                friend={friendToEdit}
            />
        </div>
    )
}
