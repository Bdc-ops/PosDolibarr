import type { Invoice, Order } from "../types/dolibarr.types"

const MS_THRESHOLD = 2_000_000_000_000

export function parseDolibarrDate(value: string | number | undefined | null): Date | null {
  if (value === null || value === undefined) return null

  if (typeof value === "number") {
    const timestamp = value > MS_THRESHOLD ? value : value * 1000
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? null : date
  }

  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

export function getInvoiceDate(invoice: Invoice | Record<string, any>): Date | null {
  return (
    parseDolibarrDate(invoice.date) ||
    parseDolibarrDate(invoice.datef) ||
    parseDolibarrDate(invoice.date_creation) ||
    parseDolibarrDate(invoice.datec) ||
    null
  )
}

export function getOrderDate(order: Order | Record<string, any>): Date | null {
  return (
    parseDolibarrDate(order.date_commande) ||
    parseDolibarrDate(order.date_creation) ||
    parseDolibarrDate(order.date) ||
    null
  )
}
