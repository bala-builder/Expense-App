import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Receipt, UserPlus, Settings, Search, HandCoins, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useApp } from '../context/AppContext'
import ExpenseModal from '../components/ExpenseModal'
import InviteMemberModal from '../components/InviteMemberModal'
import EditGroupModal from '../components/EditGroupModal'
import SettleUpModal from '../components/SettleUpModal'
import { cn, getCurrencySymbol, groupExpensesByMonth } from '../lib/utils'

export default function GroupDetails() {
    const { groupId } = useParams()
    const navigate = useNavigate()
    const { groups, getGroupExpenses, getGroupMembers, getGroupUserBalance, getGroupDebtsSummary, getGroupSettlements, user } = useApp()
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [expenseToEdit, setExpenseToEdit] = useState(null)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
    const [isSettleUpOpen, setIsSettleUpOpen] = useState(false)
    const [settleUpPrefill, setSettleUpPrefill] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    const group = groups.find(g => g.id === groupId)
    const expenses = getGroupExpenses(groupId)
    const members = getGroupMembers(groupId)
    const groupBalance = getGroupUserBalance(groupId)
    const groupDebts = getGroupDebtsSummary(groupId)
    const groupSettlements = getGroupSettlements(groupId)

    const getMemberName = (uid) => {
        if (uid === user?.uid) return 'You'
        return members.find(m => m.id === uid)?.name || 'Unknown'
    }

    const openSettleUp = (debt = null) => {
        setSettleUpPrefill(debt)
        setIsSettleUpOpen(true)
    }

    const filteredExpenses = useMemo(() => {
        if (!searchQuery.trim()) return expenses
        return expenses.filter(e => e.description.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [expenses, searchQuery])

    const groupedExpenses = useMemo(() => groupExpensesByMonth(filteredExpenses), [filteredExpenses]);

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
                    <Button size="sm" variant="outline" onClick={() => openSettleUp()}>
                        <HandCoins size={16} className="mr-2" />
                        Settle Up
                    </Button>
                </div>
            </div>

            {/* Who Owes Whom */}
            <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-semibold text-slate-900">Balances</h2>
                    <p className="text-xs text-secondary mt-0.5">Who owes whom in this group</p>
                </div>
                <div className="p-4">
                    {groupDebts.length === 0 ? (
                        <p className="text-sm text-secondary text-center py-4">
                            {expenses.length === 0 ? 'Add expenses to see balances.' : 'All settled up! No outstanding debts.'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {groupDebts.map((debt, i) => (
                                <div
                                    key={`${debt.fromUid}-${debt.toUid}-${debt.currency}-${i}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-slate-900">{getMemberName(debt.fromUid)}</span>
                                        <span className="text-slate-400">owes</span>
                                        <span className="font-medium text-slate-900">{getMemberName(debt.toUid)}</span>
                                        <span className="font-bold text-red-600">
                                            {getCurrencySymbol(debt.currency)}{debt.amount.toFixed(2)}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => openSettleUp(debt)}
                                    >
                                        Settle
                                        <ArrowRight size={14} className="ml-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Settlement History */}
            {groupSettlements.length > 0 && (
                <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-semibold text-slate-900">Settlements</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[...groupSettlements]
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(settlement => (
                                <div key={settlement.id} className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <HandCoins size={16} className="text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900">
                                            <span className="font-medium">{getMemberName(settlement.fromUid)}</span>
                                            {' paid '}
                                            <span className="font-medium">{getMemberName(settlement.toUid)}</span>
                                        </p>
                                        <p className="text-xs text-secondary">
                                            {settlement.date}{settlement.note ? ` · ${settlement.note}` : ''}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-green-600 shrink-0">
                                        {getCurrencySymbol(settlement.currency)}{settlement.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Expenses List */}
            <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="font-semibold text-slate-900">Expenses</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search expenses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-white"
                        />
                    </div>
                </div>
                {Object.keys(groupedExpenses).length === 0 ? (
                    <div className="p-8 text-center text-secondary">
                        <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                        <p>{searchQuery ? "No expenses found matching your search." : "No expenses yet."}</p>
                        {!searchQuery && <Button variant="link" onClick={() => { setExpenseToEdit(null); setIsAddExpenseOpen(true); }}>Add the first one</Button>}
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
                                        const payer = members.find(m => m.id === expense.paidBy)
                                        const isPayer = expense.paidBy === user.uid
                                        const [y, m, d] = expense.date.split('-')
                                        const dateObj = new Date(y, m - 1, d)
                                        const monthStr = dateObj.toLocaleString('default', { month: 'short' })

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
                                                    <div className="flex flex-col items-center justify-center w-10 shrink-0">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{monthStr}</span>
                                                        <span className="text-lg font-bold text-slate-700 leading-none">{d}</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 hidden sm:flex">
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
                            </div>
                        ))}
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

            <SettleUpModal
                isOpen={isSettleUpOpen}
                onClose={() => { setIsSettleUpOpen(false); setSettleUpPrefill(null) }}
                groupId={groupId}
                members={members}
                prefill={settleUpPrefill}
            />
        </div >
    )
}


