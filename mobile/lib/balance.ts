import type { Expense } from "@/context/AppContext";

export interface Settlement {
  id: string;
  groupId: string;
  fromUid: string;
  toUid: string;
  amount: number;
  currency: string;
  date: string;
  note?: string;
  createdBy: string;
  createdAt: any;
}

export function getMemberShare(expense: Expense, uid: string): number {
  if (!expense.splitAmong?.includes(uid)) return 0;
  if (expense.splitType === "percentage" && expense.splitDetails) {
    return (expense.amount * (expense.splitDetails[uid] || 0)) / 100;
  }
  return expense.amount / expense.splitAmong.length;
}

export function getMemberBalancesByCurrency(
  expenses: Expense[],
  memberUids: string[],
  settlements: Settlement[] = []
): Record<string, Record<string, number>> {
  const balances: Record<string, Record<string, number>> = {};

  const ensure = (currency: string, uid: string) => {
    if (!balances[currency]) balances[currency] = {};
    if (balances[currency][uid] === undefined) balances[currency][uid] = 0;
  };

  expenses.forEach((expense) => {
    const currency = expense.currency || "USD";
    if (expense.paidBy) {
      ensure(currency, expense.paidBy);
      balances[currency][expense.paidBy] += expense.amount;
    }
    expense.splitAmong?.forEach((uid) => {
      ensure(currency, uid);
      balances[currency][uid] -= getMemberShare(expense, uid);
    });
  });

  settlements.forEach((s) => {
    const currency = s.currency || "USD";
    ensure(currency, s.fromUid);
    ensure(currency, s.toUid);
    balances[currency][s.fromUid] += s.amount;
    balances[currency][s.toUid] -= s.amount;
  });

  return balances;
}

export function simplifyDebts(
  balances: Record<string, number>
): { fromUid: string; toUid: string; amount: number }[] {
  const creditors: { uid: string; amount: number }[] = [];
  const debtors: { uid: string; amount: number }[] = [];

  Object.entries(balances).forEach(([uid, balance]) => {
    if (balance > 0.01) creditors.push({ uid, amount: balance });
    else if (balance < -0.01) debtors.push({ uid, amount: -balance });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts: { fromUid: string; toUid: string; amount: number }[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      debts.push({
        fromUid: debtors[i].uid,
        toUid: creditors[j].uid,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return debts;
}

export function getGroupDebts(
  expenses: Expense[],
  memberUids: string[],
  settlements: Settlement[] = []
): { fromUid: string; toUid: string; amount: number; currency: string }[] {
  const byCurrency = getMemberBalancesByCurrency(expenses, memberUids, settlements);
  const debts: { fromUid: string; toUid: string; amount: number; currency: string }[] = [];

  Object.entries(byCurrency).forEach(([currency, balances]) => {
    simplifyDebts(balances).forEach((d) => debts.push({ ...d, currency }));
  });

  return debts;
}
