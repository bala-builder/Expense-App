export function getMemberShare(expense, uid) {
    if (!Array.isArray(expense.splitAmong) || !expense.splitAmong.includes(uid)) return 0
    if (expense.splitType === 'percentage' && expense.splitDetails) {
        return expense.amount * (expense.splitDetails[uid] || 0) / 100
    }
    return expense.amount / expense.splitAmong.length
}

export function getMemberBalancesByCurrency(expenses, memberUids, settlements = []) {
    const balances = {}

    const ensure = (currency, uid) => {
        if (!balances[currency]) balances[currency] = {}
        if (balances[currency][uid] === undefined) balances[currency][uid] = 0
    }

    expenses.forEach(expense => {
        const currency = expense.currency || 'USD'
        if (expense.paidBy) {
            ensure(currency, expense.paidBy)
            balances[currency][expense.paidBy] += expense.amount
        }
        expense.splitAmong?.forEach(uid => {
            ensure(currency, uid)
            balances[currency][uid] -= getMemberShare(expense, uid)
        })
    })

    settlements.forEach(s => {
        const currency = s.currency || 'USD'
        ensure(currency, s.fromUid)
        ensure(currency, s.toUid)
        balances[currency][s.fromUid] += s.amount
        balances[currency][s.toUid] -= s.amount
    })

    return balances
}

export function simplifyDebts(balances) {
    const creditors = []
    const debtors = []

    Object.entries(balances).forEach(([uid, balance]) => {
        if (balance > 0.01) creditors.push({ uid, amount: balance })
        else if (balance < -0.01) debtors.push({ uid, amount: -balance })
    })

    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)

    const debts = []
    let i = 0
    let j = 0

    while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i].amount, creditors[j].amount)
        if (amount > 0.01) {
            debts.push({
                fromUid: debtors[i].uid,
                toUid: creditors[j].uid,
                amount: Math.round(amount * 100) / 100
            })
        }
        debtors[i].amount -= amount
        creditors[j].amount -= amount
        if (debtors[i].amount < 0.01) i++
        if (creditors[j].amount < 0.01) j++
    }

    return debts
}

export function getGroupDebts(expenses, memberUids, settlements = []) {
    const byCurrency = getMemberBalancesByCurrency(expenses, memberUids, settlements)
    const debts = []

    Object.entries(byCurrency).forEach(([currency, balances]) => {
        simplifyDebts(balances).forEach(d => debts.push({ ...d, currency }))
    })

    return debts
}
