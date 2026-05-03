import { useState, useMemo } from 'react'
import { Receipt, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { cn, getCurrencySymbol, groupExpensesByMonth } from '../lib/utils'
import { Input } from '../components/ui/input'
import ExpenseModal from '../components/ExpenseModal'

export default function Activity() {
    const { expenses, groups, users, user, getGroupMembers } = useApp()
    const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)
    const [expenseToEdit, setExpenseToEdit] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredExpenses = useMemo(() => {
        if (!searchQuery.trim()) return expenses
        return expenses.filter(e => e.description.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [expenses, searchQuery])

    const groupedExpenses = useMemo(() => groupExpensesByMonth(filteredExpenses), [filteredExpenses]);

    const getGroupName = (groupId) => {
        const group = groups.find(g => g.id === groupId)
        return group ? group.name : 'Unknown Group'
    }

    const getUserName = (userId) => {
        if (!user) return 'Unknown'
        // Use user.uid for current user check
        if (userId === user.uid) return 'You'
        // Use u.id (which we injected in AppContext) to find user
        const u = users.find(u => u.id === userId)
        return u ? (u.name || u.displayName || 'Unknown') : 'Unknown User'
    }

    const handleExpenseClick = (expense) => {
        setExpenseToEdit(expense)
        setIsEditExpenseOpen(true)
    }

    // Helper to safely get members for the modal even if group is missing (edge case)
    const getMembersForModal = () => {
        if (!expenseToEdit) return []
        return getGroupMembers(expenseToEdit.groupId)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Recent Activity</h1>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search activity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {Object.keys(groupedExpenses).length === 0 ? (
                    <div className="p-12 text-center text-secondary">
                        <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                        <p>{searchQuery ? "No activity found matching your search." : "No recent activity."}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {Object.entries(groupedExpenses).map(([monthYear, monthExpenses]) => (
                            <div key={monthYear}>
                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {monthYear}
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {monthExpenses.map(expense => {
                                        const isPayer = expense.paidBy === user?.uid
                                        const [y, m, d] = expense.date.split('-')
                                        const dateObj = new Date(y, m - 1, d)
                                        const monthStr = dateObj.toLocaleString('default', { month: 'short' })

                                        return (
                                            <div
                                                key={expense.id}
                                                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => handleExpenseClick(expense)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center justify-center w-10 shrink-0">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{monthStr}</span>
                                                        <span className="text-lg font-bold text-slate-700 leading-none">{d}</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 hidden sm:flex">
                                                        <Receipt size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 text-sm sm:text-base">
                                                            <span className="font-semibold">{getUserName(expense.paidBy)}</span> added "{expense.description}" in <span className="font-semibold">{getGroupName(expense.groupId)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                                                    </p>
                                                    {user && expense.splitAmong.includes(user.uid) && (() => {
                                                        // Calculate my share
                                                        let myShare = 0
                                                        if (expense.splitType === 'percentage' && expense.splitDetails) {
                                                            const percentage = expense.splitDetails[user.uid] || 0
                                                            myShare = (expense.amount * percentage) / 100
                                                        } else {
                                                            const splitCount = expense.splitAmong.length
                                                            myShare = expense.amount / splitCount
                                                        }

                                                        // Calculate net impact
                                                        const amountPaid = isPayer ? expense.amount : 0
                                                        const netImpact = amountPaid - myShare

                                                        if (Math.abs(netImpact) <= 0.005) {
                                                            return <p className="text-xs text-slate-400">settled</p>
                                                        }

                                                        return (
                                                            <p className={cn("text-xs", netImpact > 0 ? "text-green-600" : "text-red-600")}>
                                                                {netImpact > 0 ? 'you lent' : 'you owe'} {getCurrencySymbol(expense.currency)}{Math.abs(netImpact).toFixed(2)}
                                                            </p>
                                                        )
                                                    })()}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {expenseToEdit && (
                <ExpenseModal
                    isOpen={isEditExpenseOpen}
                    onClose={() => setIsEditExpenseOpen(false)}
                    groupId={expenseToEdit.groupId}
                    members={getMembersForModal()}
                    expenseToEdit={expenseToEdit}
                />
            )}
        </div>
    )
}
