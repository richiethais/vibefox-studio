import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import {
  BILLING_KIND_LABELS,
  BILLING_STATUS_COLORS,
  formatCurrency,
  getBillingActionLabel,
  getBillingActionUrl,
  isStripeBacked,
} from '../../lib/billing'
import { parseFunctionError } from '../../lib/supabaseFunctions'
import useIsMobile from '../../components/useIsMobile'

const STATUSES = ['unpaid', 'paid', 'overdue']
const CURRENCIES = ['usd', 'eur', 'gbp', 'cad']

function sanitizeMoneyInput(value) {
  const stripped = String(value || '').replace(/[^0-9.]/g, '')
  const [whole = '', ...rest] = stripped.split('.')
  const decimals = rest.join('').slice(0, 2)
  return decimals ? `${whole}.${decimals}` : whole
}

function sanitizeIntegerInput(value, fallback = '1') {
  const digits = String(value || '').replace(/\D/g, '')
  return digits || fallback
}

function formatPhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11)

  if (!digits) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  return `1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
}

function hasValidPhone(value) {
  if (!value.trim()) return true
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

function createLineItem() {
  return {
    amount: '',
    description: '',
    id: crypto.randomUUID(),
    name: '',
    quantity: '1',
  }
}

function createCustomField() {
  return {
    id: crypto.randomUUID(),
    name: '',
    value: '',
  }
}

function createBillingForm(kind = 'invoice') {
  return {
    client_id: '',
    currency: 'usd',
    custom_fields: kind === 'invoice' ? [createCustomField()] : [],
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    description: '',
    due_date: '',
    footer: 'Questions about this billing item? Reply to this email and we will handle it directly.',
    kind,
    line_items: [createLineItem()],
    send_invoice_now: true,
  }
}

const overlay = {
  alignItems: 'center',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  inset: 0,
  justifyContent: 'center',
  position: 'fixed',
  zIndex: 100,
}

const inp = {
  background: '#faf9f7',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  boxSizing: 'border-box',
  color: '#18181a',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  padding: '11px 14px',
  width: '100%',
}

const darkBtn = {
  background: '#18181a',
  border: 'none',
  borderRadius: 100,
  color: 'white',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  padding: '9px 18px',
}

const ghostBtn = {
  background: 'white',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 100,
  color: '#18181a',
  cursor: 'pointer',
  fontSize: 12,
  padding: '8px 14px',
}

export default function AdminInvoices() {
  const session = useAuth()
  const isMobile = useIsMobile(768)
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [billingModal, setBillingModal] = useState(null)
  const [billingForm, setBillingForm] = useState(() => createBillingForm())
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    client_id: '',
    description: '',
    due_date: '',
    status: 'unpaid',
  })

  const load = useCallback(async () => {
    const [invoicesRes, clientsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, clients(name, email, phone, company)')
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id, name, email, phone, company')
        .order('name', { ascending: true }),
    ])

    if (invoicesRes.error || clientsRes.error) {
      setNotice({
        type: 'error',
        text: invoicesRes.error?.message || clientsRes.error?.message || 'Failed to load billing items.',
      })
      setLoading(false)
      return
    }

    setInvoices(invoicesRes.data ?? [])
    setClients(clientsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const billingValidationError = useMemo(() => {
    if (!session) return 'Admin session expired. Sign in again.'
    if (!billingForm.client_id) return 'Select a client.'

    const hasLineItemError = billingForm.line_items.some(item => {
      const amount = Number(item.amount)
      const quantity = Number(item.quantity)
      return !item.name.trim() || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(quantity) || quantity < 1
    })

    if (hasLineItemError) return 'Each line item needs a name, a positive amount, and a valid quantity.'
    if (billingForm.kind === 'invoice' && !billingForm.customer_email.trim()) return 'Customer email is required for invoices.'
    if (!hasValidPhone(billingForm.customer_phone)) return 'Phone number must be 10 digits, or 11 digits starting with 1.'

    return ''
  }, [billingForm, session])

  const editValidationError = useMemo(() => {
    if (!editModal) return ''
    if (!editForm.status) return 'Status is required.'

    if (!isStripeBacked(editModal)) {
      if (!editForm.client_id) return 'Client is required.'
      if (!editForm.description.trim()) return 'Description is required.'
      const amount = Number(editForm.amount)
      if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be greater than 0.'
    }

    return ''
  }, [editForm, editModal])

  function setBillingField(key) {
    return event => setBillingForm(current => ({ ...current, [key]: event.target.value }))
  }

  function setEditField(key) {
    return event => setEditForm(current => ({
      ...current,
      [key]: key === 'amount' ? sanitizeMoneyInput(event.target.value) : event.target.value,
    }))
  }

  function openCreate(kind) {
    setBillingForm(createBillingForm(kind))
    setBillingModal(kind)
  }

  function openEdit(invoice) {
    setEditForm({
      amount: String(invoice.amount ?? ''),
      client_id: invoice.client_id || '',
      description: invoice.description || '',
      due_date: invoice.due_date || '',
      status: invoice.status || 'unpaid',
    })
    setEditModal(invoice)
  }

  function handleBillingClientChange(event) {
    const clientId = event.target.value
    const client = clients.find(row => row.id === clientId)

    setBillingForm(current => ({
      ...current,
      client_id: clientId,
      customer_email: client?.email || '',
      customer_name: client?.name || '',
      customer_phone: formatPhoneInput(client?.phone || ''),
    }))
  }

  function updateLineItem(id, key, value) {
    setBillingForm(current => ({
      ...current,
      line_items: current.line_items.map(item => {
        if (item.id !== id) return item

        if (key === 'amount') {
          return { ...item, amount: sanitizeMoneyInput(value) }
        }

        if (key === 'quantity') {
          return { ...item, quantity: sanitizeIntegerInput(value) }
        }

        return { ...item, [key]: value }
      }),
    }))
  }

  function handleBillingPhoneChange(event) {
    setBillingForm(current => ({
      ...current,
      customer_phone: formatPhoneInput(event.target.value),
    }))
  }

  function addLineItem() {
    setBillingForm(current => ({
      ...current,
      line_items: [...current.line_items, createLineItem()],
    }))
  }

  function removeLineItem(id) {
    setBillingForm(current => ({
      ...current,
      line_items: current.line_items.length === 1
        ? current.line_items
        : current.line_items.filter(item => item.id !== id),
    }))
  }

  function updateCustomField(id, key, value) {
    setBillingForm(current => ({
      ...current,
      custom_fields: current.custom_fields.map(item => (item.id === id ? { ...item, [key]: value } : item)),
    }))
  }

  function addCustomField() {
    setBillingForm(current => ({
      ...current,
      custom_fields: current.custom_fields.length >= 4
        ? current.custom_fields
        : [...current.custom_fields, createCustomField()],
    }))
  }

  function removeCustomField(id) {
    setBillingForm(current => ({
      ...current,
      custom_fields: current.custom_fields.filter(item => item.id !== id),
    }))
  }

  const billingTotal = billingForm.line_items.reduce((sum, item) => {
    const amount = Number(item.amount)
    const quantity = Number(item.quantity)
    return sum + (Number.isFinite(amount) ? amount : 0) * (Number.isInteger(quantity) ? quantity : 0)
  }, 0)

  async function submitBilling() {
    if (saving || billingValidationError || !session) return

    setSaving(true)
    setNotice(null)

    const { data, error } = await supabase.functions.invoke('admin-billing', {
      body: {
        action: billingForm.kind === 'payment_link' ? 'create_payment_link' : 'create_invoice',
        client_id: billingForm.client_id,
        currency: billingForm.currency,
        custom_fields: billingForm.custom_fields
          .map(field => ({ name: field.name.trim(), value: field.value.trim() }))
          .filter(field => field.name && field.value),
        customer_email: billingForm.customer_email.trim(),
        customer_name: billingForm.customer_name.trim(),
        customer_phone: billingForm.customer_phone.trim(),
        description: billingForm.description.trim(),
        due_date: billingForm.due_date || null,
        footer: billingForm.footer.trim(),
        line_items: billingForm.line_items.map(item => ({
          amount: item.amount,
          description: item.description.trim(),
          name: item.name.trim(),
          quantity: item.quantity,
        })),
        send_invoice_now: billingForm.send_invoice_now,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) {
      const details = await parseFunctionError(error, 'Could not create billing item.')
      setNotice({ type: 'error', text: details.message })
      setSaving(false)
      return
    }

    setNotice({
      actionHref: data?.url || '',
      actionLabel: billingForm.kind === 'payment_link' ? 'Open payment link' : 'Open invoice',
      type: 'success',
      text: billingForm.kind === 'payment_link' ? 'Payment link created.' : 'Invoice created in Stripe.',
    })
    setBillingModal(null)
    setBillingForm(createBillingForm())
    setSaving(false)
    await load()
  }

  async function saveEdit() {
    if (!editModal || saving || editValidationError) return

    setSaving(true)
    setNotice(null)

    const payload = isStripeBacked(editModal)
      ? {
          due_date: editForm.due_date || null,
          status: editForm.status,
        }
      : {
          amount: Number(editForm.amount),
          client_id: editForm.client_id,
          description: editForm.description.trim(),
          due_date: editForm.due_date || null,
          status: editForm.status,
        }

    const { error } = await supabase
      .from('invoices')
      .update(payload)
      .eq('id', editModal.id)

    if (error) {
      setNotice({ type: 'error', text: error.message || 'Could not update billing item.' })
      setSaving(false)
      return
    }

    setNotice({
      type: 'success',
      text: isStripeBacked(editModal)
        ? 'Billing status updated locally.'
        : 'Billing item updated.',
    })
    setEditModal(null)
    setSaving(false)
    await load()
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#18181a', fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px', margin: 0 }}>Invoices & Billing</h1>
          <p style={{ color: '#7a7888', fontSize: 13, margin: '6px 0 0' }}>
            Create Stripe invoices and custom payment links directly from the CRM.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button onClick={() => openCreate('payment_link')} style={ghostBtn}>+ New payment link</button>
          <button onClick={() => openCreate('invoice')} style={darkBtn}>+ New invoice</button>
        </div>
      </div>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 10,
          color: notice.type === 'error' ? '#dc2626' : '#166534',
          fontSize: 13,
          marginBottom: 16,
          padding: '10px 16px',
        }}>
          <div>{notice.text}</div>
          {notice.actionHref && (
            <a
              href={notice.actionHref}
              rel="noreferrer"
              style={{ color: notice.type === 'error' ? '#dc2626' : '#166534', display: 'inline-block', fontWeight: 600, marginTop: 8 }}
              target="_blank"
            >
              {notice.actionLabel || 'Open'}
            </a>
          )}
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Client', 'Type', 'Description', 'Amount', 'Status', 'Access', 'Due', 'Actions'].map(header => (
                  <th
                    key={header}
                    style={{ color: '#7a7888', fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', padding: '12px 16px', textAlign: 'left', textTransform: 'uppercase' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ color: '#7a7888', fontSize: 13, padding: '16px' }}>Loading billing items...</td>
                </tr>
              )}

              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: '#7a7888', fontSize: 13, padding: '16px' }}>No billing items yet.</td>
                </tr>
              )}

              {!loading && invoices.map(invoice => {
                const actionUrl = getBillingActionUrl(invoice)
                const actionLabel = getBillingActionLabel(invoice)
                const statusColor = BILLING_STATUS_COLORS[invoice.status] || BILLING_STATUS_COLORS.unpaid

                return (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ color: '#18181a', fontWeight: 500, padding: '12px 16px' }}>{invoice.clients?.name ?? 'Unassigned'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...badge, background: '#f3f4f6', color: '#4b5563' }}>
                        {BILLING_KIND_LABELS[invoice.kind] || 'Invoice'}
                      </span>
                    </td>
                    <td style={{ color: '#7a7888', maxWidth: 320, padding: '12px 16px' }}>
                      <div style={{ color: '#18181a', fontWeight: 500, marginBottom: 4 }}>{invoice.description}</div>
                      {Array.isArray(invoice.line_items) && invoice.line_items.length > 0 && (
                        <div style={{ fontSize: 12 }}>
                          {invoice.line_items.length} custom line item{invoice.line_items.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#18181a', fontWeight: 600, padding: '12px 16px' }}>
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...badge, background: statusColor.bg, color: statusColor.text }}>{invoice.status}</span>
                    </td>
                    <td style={{ color: '#7a7888', padding: '12px 16px' }}>
                      {invoice.stripe_invoice_status || (isStripeBacked(invoice) ? 'created' : 'manual')}
                    </td>
                    <td style={{ color: '#7a7888', padding: '12px 16px' }}>{invoice.due_date || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {actionUrl && (
                          <a href={actionUrl} rel="noreferrer" style={ghostBtn} target="_blank">
                            {actionLabel}
                          </a>
                        )}
                        <button onClick={() => openEdit(invoice)} style={ghostBtn}>
                          {isStripeBacked(invoice) ? 'Update status' : 'Edit'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {billingModal && (
        <div style={overlay}>
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', margin: isMobile ? 16 : 0, maxHeight: '92vh', maxWidth: 760, overflowY: 'auto', padding: isMobile ? 20 : 28, width: '100%' }}>
            <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h2 style={{ color: '#18181a', fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {billingForm.kind === 'payment_link' ? 'Create payment link' : 'Create invoice'}
                </h2>
                <p style={{ color: '#7a7888', fontSize: 13, margin: '6px 0 0' }}>
                  {billingForm.kind === 'payment_link'
                    ? 'Create a shareable Stripe payment link with custom prices from this CRM.'
                    : 'Create a Stripe invoice with custom line items and optional email delivery.'}
                </p>
              </div>
              <button onClick={() => setBillingModal(null)} style={{ background: 'none', border: 'none', color: '#7a7888', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>x</button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {billingValidationError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 12, padding: '8px 10px' }}>
                  {billingValidationError}
                </div>
              )}

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr' }}>
                <div>
                  <Label>Client</Label>
                  <select value={billingForm.client_id} onChange={handleBillingClientChange} style={inp}>
                    <option value="">Select client *</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <select value={billingForm.currency} onChange={setBillingField('currency')} style={inp}>
                    {CURRENCIES.map(currency => <option key={currency} value={currency}>{currency.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <input
                  placeholder="Internal summary or invoice title"
                  style={inp}
                  value={billingForm.description}
                  onChange={setBillingField('description')}
                />
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }}>
                <div>
                  <Label>Customer name</Label>
                  <input style={inp} value={billingForm.customer_name} onChange={setBillingField('customer_name')} />
                </div>
                <div>
                  <Label>Customer email</Label>
                  <input style={inp} type="email" value={billingForm.customer_email} onChange={setBillingField('customer_email')} />
                </div>
                <div>
                  <Label>Customer phone</Label>
                  <input
                    inputMode="tel"
                    pattern="[0-9()\\-\\s]+"
                    placeholder="(555) 123-4567"
                    style={inp}
                    value={billingForm.customer_phone}
                    onChange={handleBillingPhoneChange}
                  />
                </div>
              </div>

              <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ color: '#18181a', fontSize: 14, fontWeight: 600 }}>Line items</div>
                    <div style={{ color: '#7a7888', fontSize: 12, marginTop: 4 }}>Add custom names, notes, quantities, and prices.</div>
                  </div>
                  <button onClick={addLineItem} style={ghostBtn} type="button">Add row</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {billingForm.line_items.map((item, index) => (
                    <div key={item.id} style={{ background: '#faf9f7', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: 14 }}>
                      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ color: '#18181a', fontSize: 13, fontWeight: 600 }}>Item {index + 1}</div>
                        {billingForm.line_items.length > 1 && (
                          <button onClick={() => removeLineItem(item.id)} style={{ background: 'none', border: 'none', color: '#7a7888', cursor: 'pointer', fontSize: 12 }} type="button">
                            Remove
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr' }}>
                        <input placeholder="Item name *" style={inp} value={item.name} onChange={event => updateLineItem(item.id, 'name', event.target.value)} />
                        <input
                          inputMode="decimal"
                          placeholder="Price *"
                          style={inp}
                          type="text"
                          value={item.amount}
                          onChange={event => updateLineItem(item.id, 'amount', event.target.value)}
                        />
                        <input
                          inputMode="numeric"
                          placeholder="Qty *"
                          style={inp}
                          type="text"
                          value={item.quantity}
                          onChange={event => updateLineItem(item.id, 'quantity', event.target.value)}
                        />
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <input placeholder="Optional detail shown on Stripe" style={inp} value={item.description} onChange={event => updateLineItem(item.id, 'description', event.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {billingForm.kind === 'invoice' && (
                <>
                  <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 16 }}>
                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ color: '#18181a', fontSize: 14, fontWeight: 600 }}>Custom fields</div>
                        <div style={{ color: '#7a7888', fontSize: 12, marginTop: 4 }}>Optional invoice details like PO number or campaign.</div>
                      </div>
                      <button onClick={addCustomField} style={ghostBtn} type="button">Add field</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {billingForm.custom_fields.length === 0 && (
                        <div style={{ color: '#7a7888', fontSize: 12 }}>No custom invoice fields added.</div>
                      )}

                      {billingForm.custom_fields.map(field => (
                        <div key={field.id} style={{ display: 'grid', gap: 10, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto' }}>
                          <input placeholder="Field name" style={inp} value={field.name} onChange={event => updateCustomField(field.id, 'name', event.target.value)} />
                          <input placeholder="Field value" style={inp} value={field.value} onChange={event => updateCustomField(field.id, 'value', event.target.value)} />
                          <button onClick={() => removeCustomField(field.id)} style={ghostBtn} type="button">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : '0.7fr 1.3fr' }}>
                    <div>
                      <Label>Due date</Label>
                      <input style={inp} type="date" value={billingForm.due_date} onChange={setBillingField('due_date')} />
                    </div>
                    <div>
                      <Label>Footer note</Label>
                      <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={billingForm.footer} onChange={setBillingField('footer')} />
                    </div>
                  </div>

                  <label style={{ alignItems: 'center', color: '#18181a', display: 'flex', fontSize: 13, gap: 10 }}>
                    <input
                      checked={billingForm.send_invoice_now}
                      onChange={event => setBillingForm(current => ({ ...current, send_invoice_now: event.target.checked }))}
                      type="checkbox"
                    />
                    Email the invoice to the client immediately after creation.
                  </label>
                </>
              )}

              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <div style={{ color: '#18181a', fontSize: 14, fontWeight: 600 }}>
                  Total: {formatCurrency(billingTotal, billingForm.currency)}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setBillingModal(null)} style={ghostBtn} type="button">Cancel</button>
                  <button onClick={submitBilling} style={darkBtn} disabled={saving || Boolean(billingValidationError)}>
                    {saving ? 'Saving...' : billingForm.kind === 'payment_link' ? 'Create payment link' : 'Create invoice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div style={overlay}>
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', margin: isMobile ? 16 : 0, maxWidth: 460, padding: isMobile ? 20 : 28, width: '100%' }}>
            <h2 style={{ color: '#18181a', fontSize: 17, fontWeight: 600, margin: '0 0 18px' }}>
              {isStripeBacked(editModal) ? 'Update billing status' : 'Edit billing item'}
            </h2>

            {isStripeBacked(editModal) && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, color: '#9a3412', fontSize: 12, marginBottom: 14, padding: '10px 12px' }}>
                Stripe-backed amounts and descriptions are read-only here so the CRM does not drift from Stripe. Update the local status after payment is confirmed.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!isStripeBacked(editModal) && (
                <>
                  <select value={editForm.client_id} onChange={setEditField('client_id')} style={inp}>
                    <option value="">Select client *</option>
                    {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                  <input placeholder="Description *" style={inp} value={editForm.description} onChange={setEditField('description')} />
                  <input
                    inputMode="decimal"
                    placeholder="Amount *"
                    style={inp}
                    type="text"
                    value={editForm.amount}
                    onChange={setEditField('amount')}
                  />
                </>
              )}

              <select value={editForm.status} onChange={setEditField('status')} style={inp}>
                {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>

              <div>
                <Label>Due date</Label>
                <input type="date" style={inp} value={editForm.due_date} onChange={setEditField('due_date')} />
              </div>

              {editValidationError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 12, padding: '8px 10px' }}>
                  {editValidationError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setEditModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={saveEdit} style={darkBtn} disabled={saving || Boolean(editValidationError)}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{ color: '#7a7888', fontSize: 11, letterSpacing: '0.5px', marginBottom: 4, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

const badge = {
  borderRadius: 100,
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 9px',
  textTransform: 'capitalize',
}
