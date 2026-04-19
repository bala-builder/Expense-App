import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { cn, getCurrencySymbol } from '../lib/utils'
import ExpenseModal from '../components/ExpenseModal'

export default function Activity() {
    const { expenses, groups, users, user, getGroupMembers } = useApp()
    const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)
    const [expenseToEdit, setExpenseToEdit] = useState(null)

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))

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
            <h1 className="text-2xl font-bold text-slate-900">Recent Activity</h1>

            <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {sortedExpenses.length === 0 ? (
                    <div className="p-12 text-center text-secondary">
                        <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                        <p>No recent activity.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sortedExpenses.map(expense => {
                            const isPayer = expense.paidBy === user?.uid

                            return (
                                <div
                                    key={expense.id}
                                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => handleExpenseClick(expense)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Receipt size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                <span className="font-semibold">{getUserName(expense.paidBy)}</span> added "{expense.description}" in <span className="font-semibold">{getGroupName(expense.groupId)}</span>
                                            </p>
                                            <p className="text-xs text-secondary">
                                                {expense.date}
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
