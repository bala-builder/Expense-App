import { useState, useEffect } from 'react'
import { X, HandCoins } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useApp } from '../context/AppContext'

export default function SettleUpModal({ isOpen, onClose, groupId, members, prefill }) {
    const { addSettlement, user } = useApp()
    const [fromUid, setFromUid] = useState('')
    const [toUid, setToUid] = useState('')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && prefill) {
            setFromUid(prefill.fromUid)
            setToUid(prefill.toUid)
            setAmount(String(prefill.amount))
            setCurrency(prefill.currency || 'USD')
        } else if (isOpen) {
            setFromUid(user?.uid || '')
            setToUid('')
            setAmount('')
            setCurrency('USD')
            setDate(new Date().toISOString().split('T')[0])
            setNote('')
        }
    }, [isOpen, prefill, user])

    if (!isOpen) return null

    const getMemberName = (uid) => {
        if (uid === user?.uid) return 'You'
        return members.find(m => m.id === uid)?.name || 'Unknown'
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!fromUid || !toUid || fromUid === toUid) return
        const amt = parseFloat(amount)
        if (!amount || isNaN(amt) || amt <= 0) return

        setLoading(true)
        try {
            await addSettlement(groupId, fromUid, toUid, amt, currency, date, note)
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to record settlement')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <HandCoins size={20} className="text-green-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Settle Up</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X size={18} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">Who paid?</label>
                            <select
                                value={fromUid}
                                onChange={(e) => setFromUid(e.target.value)}
                                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                required
                            >
                                <option value="">Select...</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.id === user?.uid ? 'You' : m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">Who received?</label>
                            <select
                                value={toUid}
                                onChange={(e) => setToUid(e.target.value)}
                                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                                required
                            >
                                <option value="">Select...</option>
                                {members.filter(m => m.id !== fromUid).map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.id === user?.uid ? 'You' : m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {fromUid && toUid && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                            <span className="font-medium">{getMemberName(fromUid)}</span> paid{' '}
                            <span className="font-medium">{getMemberName(toUid)}</span>
                        </p>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">Amount</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                            >
                                {['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Date</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Note (optional)</label>
                        <Input
                            placeholder="e.g. Venmo payment"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading || !fromUid || !toUid || fromUid === toUid}>
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Record Settlement'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
