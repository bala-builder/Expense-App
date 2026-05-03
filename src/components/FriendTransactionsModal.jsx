import { X, Receipt } from 'lucide-react'
import { Button } from './ui/button'
import { useApp } from '../context/AppContext'
import { cn, getCurrencySymbol, groupExpensesByMonth } from '../lib/utils'
import { useMemo } from 'react'

export default function FriendTransactionsModal({ isOpen, onClose, friend }) {
    const { expenses, user } = useApp()

    if (!isOpen || !friend) return null

    // 1. Filter expenses where both user and friend are involved
    const sharedExpenses = useMemo(() => {
        return expenses.filter(e => 
            e.splitAmong.includes(user?.uid) && e.splitAmong.includes(friend.id)
        )
    }, [expenses, user?.uid, friend.id])

    // 2. Sort by date (descending) and group by month
    const groupedExpenses = useMemo(() => groupExpensesByMonth(sharedExpenses), [sharedExpenses]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Transaction History
                        </h2>
                        <p className="text-sm text-secondary">With {friend.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                        <X size={18} className="text-slate-500" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    {Object.keys(groupedExpenses).length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No history found</h3>
                            <p className="text-slate-500 mt-2">You haven't shared any expenses with {friend.name} yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                            {Object.entries(groupedExpenses).map(([monthYear, monthExpenses]) => (
                                <div key={monthYear}>
                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {monthYear}
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {monthExpenses.map(expense => {
                                            const isPayer = expense.paidBy === user?.uid

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
                                            const [y, m, d] = expense.date.split('-')
                                            const dateObj = new Date(y, m - 1, d)
                                            const monthStr = dateObj.toLocaleString('default', { month: 'short' })

                                            return (
                                                <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-center justify-center w-10 shrink-0">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{monthStr}</span>
                                                            <span className="text-lg font-bold text-slate-700 leading-none">{d}</span>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 hidden sm:flex">
                                                            <Receipt size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 text-sm">{expense.description}</p>
                                                            <p className="text-xs text-secondary mt-0.5">
                                                                {isPayer ? 'You' : friend.name} paid {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-4">
                                                        {Math.abs(netImpact) > 0.005 ? (
                                                            <>
                                                                <p className={cn("text-sm font-bold", netImpact > 0 ? "text-green-600" : "text-red-600")}>
                                                                    {netImpact > 0 ? '+' : '-'}{getCurrencySymbol(expense.currency)}{Math.abs(netImpact).toFixed(2)}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                                                    {netImpact > 0 ? 'you lent' : 'you owe'}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm font-medium text-slate-500">
                                                                    {getCurrencySymbol(expense.currency)}{myShare.toFixed(2)}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">your share</p>
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
            </div>
        </div>
    )
}
