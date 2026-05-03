import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useApp } from '../context/AppContext'
import CreateGroupModal from '../components/CreateGroupModal'
import ExpenseModal from '../components/ExpenseModal'
import SelectGroupModal from '../components/SelectGroupModal'
import { cn } from '../lib/utils'

export default function Dashboard() {
    const { user, groups, getUserBalance, getGroupMembers } = useApp()
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
    const [isSelectGroupOpen, setIsSelectGroupOpen] = useState(false)
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    const balance = getUserBalance()

    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groups
        return groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [groups, searchQuery])

    const handleAddExpenseClick = () => {
        if (groups.length === 0) {
            setIsCreateGroupOpen(true)
        } else {
            setIsSelectGroupOpen(true)
        }
    }

    const handleGroupSelect = (group) => {
        setSelectedGroup(group)
        setIsSelectGroupOpen(false)
        setIsAddExpenseOpen(true)
    }

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
                    <p className={cn("text-3xl font-bold mt-2", balance >= 0 ? "text-primary" : "text-red-600")}>
                        {balance >= 0 ? '+' : '-'}${Math.abs(balance).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {balance >= 0 ? "You are owed in total" : "You owe in total"}
                    </p>
                </div>
            </div>

            {/* Recent Groups */}
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
                {filteredGroups.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-secondary">{searchQuery ? "No groups found matching your search." : "No groups yet. Create one to get started!"}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGroups.map((group) => (
                            <Link key={group.id} to={`/groups/${group.id}`}>
                                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer">
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
