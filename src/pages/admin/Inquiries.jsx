import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const STATUS_COLORS = {
  new: { bg: '#dbeafe', text: '#1d4ed8' },
  contacted: { bg: '#fef3c7', text: '#d97706' },
  converted: { bg: '#dcfce7', text: '#16a34a' },
}

export default function AdminInquiries() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
  }, [])

  useEffect(() => {
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setRows(data ?? [])
    })
  }, [])

  async function setStatus(id, status) {
    await supabase.from('inquiries').update({ status }).eq('id', id)
    await load()
    setSelected(s => s?.id === id ? { ...s, status } : s)
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Inquiries</h1>

      <div style={{ display: 'grid', gridTemplateColumns: (selected && !isMobile) ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Name', 'Email', 'Service', 'Budget', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', background: selected?.id === r.id ? '#f8f6f2' : 'white' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{r.name}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.email}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.service_type}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.budget}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.text }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {selected && isMobile && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#18181a' }}>{selected.name}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
              <Detail label="Email" value={selected.email} />
              <Detail label="Company" value={selected.company || '—'} />
              <Detail label="Service" value={selected.service_type} />
              <Detail label="Budget" value={selected.budget} />
              <Detail label="Date" value={new Date(selected.created_at).toLocaleString()} />
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Message</div>
                <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6 }}>{selected.message}</div>
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Status</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['new', 'contacted', 'converted'].map(s => (
                    <button key={s} onClick={() => setStatus(selected.id, s)} style={{
                      padding: '6px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)',
                      background: selected.status === s ? '#18181a' : 'white',
                      color: selected.status === s ? 'white' : '#18181a',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selected && !isMobile && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#18181a' }}>{selected.name}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <Detail label="Email" value={selected.email} />
            <Detail label="Company" value={selected.company || '—'} />
            <Detail label="Service" value={selected.service_type} />
            <Detail label="Budget" value={selected.budget} />
            <Detail label="Date" value={new Date(selected.created_at).toLocaleString()} />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Message</div>
              <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6 }}>{selected.message}</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Status</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['new', 'contacted', 'converted'].map(s => (
                  <button key={s} onClick={() => setStatus(selected.id, s)} style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)',
                    background: selected.status === s ? '#18181a' : 'white',
                    color: selected.status === s ? 'white' : '#18181a',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#18181a' }}>{value}</div>
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
