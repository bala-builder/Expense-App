import { useState, useEffect } from 'react'
import { X, DollarSign, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useApp } from '../context/AppContext'

export default function ExpenseModal({ isOpen, onClose, groupId, members, expenseToEdit }) {
    const { addExpense, updateExpense, deleteExpense, addComment, user } = useApp()
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [paidBy, setPaidBy] = useState(user.uid)
    const [splitType, setSplitType] = useState('equal') // 'equal' | 'percentage'
    const [splitAmong, setSplitAmong] = useState(members.map(m => m.id))
    const [splitDetails, setSplitDetails] = useState({}) // { uid: percentage }
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setDescription(expenseToEdit.description)
                setAmount(expenseToEdit.amount)
                setCurrency(expenseToEdit.currency || 'USD')
                setDate(expenseToEdit.date)
                setPaidBy(expenseToEdit.paidBy)
                setSplitType(expenseToEdit.splitType || 'equal')
                setSplitAmong(expenseToEdit.splitAmong || members.map(m => m.id))
                setSplitDetails(expenseToEdit.splitDetails || {})

                // If editing and no splitDetails for percentage, init them
                if (expenseToEdit.splitType === 'percentage' && !expenseToEdit.splitDetails) {
                    const initialDetails = {}
                    const count = expenseToEdit.splitAmong.length
                    expenseToEdit.splitAmong.forEach(uid => {
                        initialDetails[uid] = (100 / count).toFixed(2)
                    })
                    setSplitDetails(initialDetails)
                }
            } else {
                // Reset for new expense
                setDescription('')
                setAmount('')
                setCurrency('USD')
                setDate(new Date().toISOString().split('T')[0])
                setPaidBy(user.uid)
                setSplitType('equal')
                setSplitAmong(members.map(m => m.id))
                setSplitDetails({})
            }
        }
    }, [isOpen, expenseToEdit, members, user.uid])

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Validation for percentage
        if (splitType === 'percentage') {
            let total = 0
            splitAmong.forEach(uid => {
                total += parseFloat(splitDetails[uid] || 0)
            })
            if (Math.abs(total - 100) > 0.1) {
                alert(`Percentages must add up to 100%. Current total: ${total.toFixed(2)}%`)
                setLoading(false)
                return
            }
        }

        try {
            const expenseData = {
                groupId, // Ignored in update usually but good for add
                description,
                amount: parseFloat(amount),
                currency,
                paidBy,
                splitAmong,
                splitType,
                splitDetails: splitType === 'percentage' ? splitDetails : {},
                date
            }

            if (expenseToEdit) {
                await updateExpense(expenseToEdit.id, expenseData)
            } else {
                await addExpense(groupId, description, amount, date, paidBy, splitAmong, splitType, expenseData.splitDetails, currency)
            }
            onClose()
        } catch (error) {
            console.error("Failed to save expense:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            setLoading(true)
            try {
                await deleteExpense(expenseToEdit.id)
                onClose()
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
    }

    const toggleSplitMember = (memberId) => {
        let newSplitAmong
        if (splitAmong.includes(memberId)) {
            newSplitAmong = splitAmong.filter(id => id !== memberId)
        } else {
            newSplitAmong = [...splitAmong, memberId]
        }
        setSplitAmong(newSplitAmong)

        // Reset percentages if we check/uncheck members to avoid confusion
        if (splitType === 'percentage') {
            const newDetails = {}
            const count = newSplitAmong.length
            newSplitAmong.forEach(uid => {
                newDetails[uid] = count > 0 ? (100 / count).toFixed(2) : 0
            })
            setSplitDetails(newDetails)
        }
    }

    const handlePercentageChange = (uid, value) => {
        setSplitDetails({
            ...splitDetails,
            [uid]: parseFloat(value) || 0
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-surface rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={18} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <Input
                            placeholder="e.g., Dinner at Mario's"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Amount & Currency</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">
                                        {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency}
                                    </span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                                <select
                                    className="w-24 h-10 rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="INR">INR</option>
                                    <option value="CAD">CAD</option>
                                    <option value="AUD">AUD</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Paid By</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={paidBy}
                            onChange={(e) => setPaidBy(e.target.value)}
                        >
                            {members.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.id === user.uid ? 'You' : member.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">Split</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setSplitType('equal')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${splitType === 'equal' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Equal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSplitType('percentage')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${splitType === 'percentage' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Percentage
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 p-2 border border-slate-100 rounded-md">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between gap-2 p-1">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                            type="checkbox"
                                            checked={splitAmong.includes(member.id)}
                                            onChange={() => toggleSplitMember(member.id)}
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-slate-700 truncate">{member.id === user.uid ? 'You' : member.name}</span>
                                    </label>

                                    {splitType === 'percentage' && splitAmong.includes(member.id) && (
                                        <div className="flex items-center gap-1 w-20">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={splitDetails[member.id] || ''}
                                                onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                                                className="h-8 text-right px-1"
                                            />
                                            <span className="text-xs text-slate-500">%</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comments Section */}
                    {expenseToEdit && (
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-medium text-slate-700">Comments</h3>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-3 max-h-40 overflow-y-auto">
                                {expenseToEdit.comments && expenseToEdit.comments.length > 0 ? (
                                    expenseToEdit.comments.map(comment => (
                                        <div key={comment.id} className="text-sm">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-semibold text-slate-900">{comment.userName}</span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 mt-1">{comment.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 text-center italic">No comments yet.</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={async () => {
                                        if (!newComment.trim()) return
                                        await addComment(expenseToEdit.id, newComment)
                                        setNewComment('')
                                    }}
                                    disabled={!newComment.trim()}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-between gap-2">
                        {expenseToEdit ? (
                            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 size={16} className="mr-2" /> Delete
                            </Button>
                        ) : <div></div>}
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">{expenseToEdit ? 'Save Changes' : 'Add Expense'}</Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
