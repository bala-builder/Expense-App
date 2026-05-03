import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currency) {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'CAD': '$',
        'AUD': '$'
    }
    return symbols[currency] || currency || '$'
}

export function groupExpensesByMonth(expenses) {
    const grouped = {}
    ;[...expenses]
        .sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt).getTime() || 0);
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt).getTime() || 0);
            return timeB - timeA;
        })
        .forEach(expense => {
            if (!expense.date) return;
            const [year, month] = expense.date.split('-')
            const dateObj = new Date(parseInt(year), parseInt(month) - 1)
            const monthYear = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' })
            
            if (!grouped[monthYear]) {
                grouped[monthYear] = []
            }
            grouped[monthYear].push(expense)
        })
    return grouped
}
