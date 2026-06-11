import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useApp } from '../context/AppContext'
import CreateGroupModal from '../components/CreateGroupModal'

export default function Groups() {
    const { groups, getGroupUserBalance, getGroupExpenses } = useApp()
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

    const { unsettled, settled } = useMemo(() => {
        const withMeta = groups.map(group => {
            const balance = getGroupUserBalance(group.id)
            const expenses = getGroupExpenses(group.id)
            const latestDate = expenses.reduce((max, e) => {
                const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt || 0)
                return d > max ? d : max
            }, new Date(0))
            return { ...group, balance, latestDate }
        })

        const byLatest = (a, b) => b.latestDate - a.latestDate

        return {
            unsettled: withMeta.filter(g => Math.abs(g.balance) >= 0.01).sort(byLatest),
            settled: withMeta.filter(g => Math.abs(g.balance) < 0.01).sort(byLatest),
        }
    }, [groups, getGroupUserBalance, getGroupExpenses])

    const formatBalance = (balance) => {
        const abs = Math.abs(balance).toFixed(2)
        if (balance > 0.01) return { text: `you're owed $${abs}`, color: 'text-emerald-600' }
        if (balance < -0.01) return { text: `you owe $${abs}`, color: 'text-red-500' }
        return { text: 'settled up', color: 'text-slate-400' }
    }

    const GroupCard = ({ group, dimmed }) => {
        const { text, color } = formatBalance(group.balance)
        return (
            <Link key={group.id} to={`/groups/${group.id}`}>
                <div className={`bg-surface p-6 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer ${dimmed ? 'border-slate-100 opacity-60' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${dimmed ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                            {group.name.substring(0, 2).toUpperCase()}
                        </div>
                        {dimmed ? (
                            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-slate-100 text-slate-400 rounded-full">
                                <CheckCircle2 size={12} />
                                Settled
                            </span>
                        ) : (
                            <span className={`text-xs font-semibold ${color}`}>{text}</span>
                        )}
                    </div>
                    <h3 className={`font-semibold ${dimmed ? 'text-slate-400' : 'text-slate-900'}`}>{group.name}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-secondary">
                        <Users size={16} />
                        <span>{group.members.length} members</span>
                    </div>
                </div>
            </Link>
        )
    }

    if (groups.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">Your Groups</h1>
                    <Button onClick={() => setIsCreateGroupOpen(true)}>
                        <Plus size={18} className="mr-2" />
                        Create Group
                    </Button>
                </div>
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Users size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No groups yet</h3>
                    <p className="text-secondary mt-1 mb-4">Create a group to start sharing expenses.</p>
                    <Button onClick={() => setIsCreateGroupOpen(true)}>Create Group</Button>
                </div>
                <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Your Groups</h1>
                <Button onClick={() => setIsCreateGroupOpen(true)}>
                    <Plus size={18} className="mr-2" />
                    Create Group
                </Button>
            </div>

            {unsettled.length > 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unsettled.map(group => <GroupCard key={group.id} group={group} dimmed={false} />)}
                    </div>
                </div>
            )}

            {settled.length > 0 && (
                <div className="space-y-4">
                    {unsettled.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 size={13} />
                                Settled groups
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {settled.map(group => <GroupCard key={group.id} group={group} dimmed={true} />)}
                    </div>
                </div>
            )}

            <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
        </div>
    )
}
