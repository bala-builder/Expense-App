import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Receipt, UserPlus, Settings } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useApp } from '../context/AppContext'
import ExpenseModal from '../components/ExpenseModal'
import InviteMemberModal from '../components/InviteMemberModal'
import EditGroupModal from '../components/EditGroupModal'
import { cn, getCurrencySymbol } from '../lib/utils'

export default function GroupDetails() {
    const { groupId } = useParams()
    const navigate = useNavigate()
    const { groups, getGroupExpenses, getGroupMembers, getGroupUserBalance, user } = useApp()
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [expenseToEdit, setExpenseToEdit] = useState(null)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)

    const group = groups.find(g => g.id === groupId)
    const expenses = getGroupExpenses(groupId)
    const members = getGroupMembers(groupId)
    const groupBalance = getGroupUserBalance(groupId)

    if (!group) {
        return <div className="p-8 text-center">Group not found</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
                        <p className="text-sm text-secondary">{members.length} members</p>
                    </div>
                </div>
                <div className="flex bg-surface px-4 py-2 rounded-lg border border-slate-200 shadow-sm items-center gap-3">
                    <div className="text-sm font-medium text-slate-500">
                        Your Balance:
                    </div>
                    <div className={cn("text-lg font-bold", groupBalance >= 0 ? "text-green-600" : "text-red-600")}>
                        {groupBalance >= 0 ? "You are owed" : "You owe"} ${Math.abs(groupBalance).toFixed(2)}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)}>
                        <UserPlus size={16} className="mr-2" />
                        Invite
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditGroupOpen(true)}>
                        <Settings size={16} className="mr-2" />
                        Edit
                    </Button>
                    <Button size="sm" onClick={() => { setExpenseToEdit(null); setIsAddExpenseOpen(true); }}>
                        <Plus size={16} className="mr-2" />
                        Add Expense
                    </Button>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-semibold text-slate-900">Expenses</h2>
                </div>
                {expenses.length === 0 ? (
                    <div className="p-8 text-center text-secondary">
                        <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                        <p>No expenses yet.</p>
                        <Button variant="link" onClick={() => { setExpenseToEdit(null); setIsAddExpenseOpen(true); }}>Add the first one</Button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {expenses.map(expense => {
                            const payer = members.find(m => m.id === expense.paidBy)
                            const isPayer = expense.paidBy === user.uid

                            // Calculate my share
                            let myShare = 0
                            if (expense.splitAmong.includes(user.uid)) {
                                if (expense.splitType === 'percentage' && expense.splitDetails) {
                                    const percentage = expense.splitDetails[user.uid] || 0
                                    myShare = (expense.amount * percentage) / 100
                                } else {
                                    const splitCount = expense.splitAmong.length
                                    myShare = expense.amount / splitCount
                                }
                            }

                            // Calculate net impact
                            const amountPaid = isPayer ? expense.amount : 0
                            const netImpact = amountPaid - myShare

                            return (
                                <div
                                    key={expense.id}
                                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => { setExpenseToEdit(expense); setIsAddExpenseOpen(true); }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Receipt size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{expense.description}</p>
                                            <p className="text-xs text-secondary">
                                                {isPayer ? 'You' : payer?.name} paid {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {Math.abs(netImpact) > 0.005 ? (
                                            <>
                                                <p className={cn("text-sm font-medium", netImpact > 0 ? "text-green-600" : "text-red-600")}>
                                                    {netImpact > 0 ? '+' : '-'}{getCurrencySymbol(expense.currency)}{Math.abs(netImpact).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {netImpact > 0 ? 'you lent' : 'you owe'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm font-medium text-slate-500">
                                                    {getCurrencySymbol(expense.currency)}{myShare.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-slate-400">your share</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <ExpenseModal
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                groupId={groupId}
                members={members}
                expenseToEdit={expenseToEdit}
            />

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                groupId={groupId}
                groupName={group?.name}
            />

            <EditGroupModal
                isOpen={isEditGroupOpen}
                onClose={() => setIsEditGroupOpen(false)}
                group={group}
                members={members}
            />
        </div >
    )
}


