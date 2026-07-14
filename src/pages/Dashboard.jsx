import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Search, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useApp } from '../context/AppContext'
import CreateGroupModal from '../components/CreateGroupModal'
import ExpenseModal from '../components/ExpenseModal'
import SelectGroupModal from '../components/SelectGroupModal'
import { cn } from '../lib/utils'

export default function Dashboard() {
    const { user, groups, dataLoading, getUserBalance, getGroupMembers, getGroupUserBalance, getGroupExpenses } = useApp()
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
    const [isSelectGroupOpen, setIsSelectGroupOpen] = useState(false)
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    const balance = getUserBalance()

    const { unsettled, settled } = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        const source = query ? groups.filter(g => g.name.toLowerCase().includes(query)) : groups

        const withMeta = source.map(group => {
            const bal = getGroupUserBalance(group.id)
            const expenses = getGroupExpenses(group.id)
            const latestDate = expenses.reduce((max, e) => {
                const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt || 0)
                return d > max ? d : max
            }, new Date(0))
            return { ...group, balance: bal, latestDate }
        })

        const byLatest = (a, b) => b.latestDate - a.latestDate

        return {
            unsettled: withMeta.filter(g => Math.abs(g.balance) >= 0.01).sort(byLatest),
            settled: withMeta.filter(g => Math.abs(g.balance) < 0.01).sort(byLatest),
        }
    }, [groups, searchQuery, getGroupUserBalance, getGroupExpenses])

    const handleAddExpenseClick = () => {
        if (groups.length === 0) setIsCreateGroupOpen(true)
        else setIsSelectGroupOpen(true)
    }

    const handleGroupSelect = (group) => {
        setSelectedGroup(group)
        setIsSelectGroupOpen(false)
        setIsAddExpenseOpen(true)
    }

    const formatBalance = (bal) => {
        const abs = Math.abs(bal).toFixed(2)
        if (bal > 0.01) return { text: `you're owed $${abs}`, color: 'text-emerald-600' }
        if (bal < -0.01) return { text: `you owe $${abs}`, color: 'text-red-500' }
        return { text: 'settled up', color: 'text-slate-400' }
    }

    const GroupCard = ({ group, dimmed }) => {
        const { text, color } = formatBalance(group.balance)
        return (
            <Link key={group.id} to={`/groups/${group.id}`}>
                <div className={`bg-surface p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer ${dimmed ? 'opacity-60' : ''}`}>
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

    const totalGroups = unsettled.length + settled.length

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={() => setIsCreateGroupOpen(true)} className="flex-1 md:flex-none justify-center">
                        <Users size={18} className="mr-2" />
                        New Group
                    </Button>
                    <Button className="flex-1 md:flex-none gap-2 justify-center shadow-md shadow-primary/20" onClick={handleAddExpenseClick}>
                        <Plus size={18} />
                        Add Expense
                    </Button>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-slate-200">
                    <p className="text-sm font-medium text-secondary">Total Balance</p>
                    {dataLoading ? (
                        <>
                            <div className="h-9 w-32 mt-2 rounded-lg bg-slate-100 animate-pulse" />
                            <div className="h-3 w-28 mt-2 rounded bg-slate-100 animate-pulse" />
                        </>
                    ) : (
                        <>
                            <p className={cn("text-3xl font-bold mt-2", balance >= 0 ? "text-primary" : "text-red-600")}>
                                {balance >= 0 ? '+' : '-'}${Math.abs(balance).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {balance >= 0 ? "You are owed in total" : "You owe in total"}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Groups */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Your Groups</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {dataLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="bg-surface p-6 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse mb-4" />
                                <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse mb-2" />
                                <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : totalGroups === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-secondary">{searchQuery ? "No groups found matching your search." : "No groups yet. Create one to get started!"}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {unsettled.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {unsettled.map(group => <GroupCard key={group.id} group={group} dimmed={false} />)}
                            </div>
                        )}

                        {settled.length > 0 && (
                            <>
                                {unsettled.length > 0 && (
                                    <div className="flex items-center gap-3 pt-2">
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
                            </>
                        )}
                    </div>
                )}
            </div>

            <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
            <SelectGroupModal
                isOpen={isSelectGroupOpen}
                onClose={() => setIsSelectGroupOpen(false)}
                groups={groups}
                onSelect={handleGroupSelect}
            />
            {selectedGroup && (
                <ExpenseModal
                    isOpen={isAddExpenseOpen}
                    onClose={() => setIsAddExpenseOpen(false)}
                    groupId={selectedGroup.id}
                    members={getGroupMembers(selectedGroup.id)}
                />
            )}
        </div>
    )
}
