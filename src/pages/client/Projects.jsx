import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

const STATUS_COLORS = {
  proposal: { bg: '#f3f4f6', text: '#6b7280' },
  active: { bg: '#dcfce7', text: '#16a34a' },
  complete: { bg: '#dbeafe', text: '#1d4ed8' },
}

export default function ClientProjects() {
  const session = useAuth()
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).maybeSingle().then(({ data: client }) => {
      if (!client) return
      supabase.from('projects').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).then(({ data }) => setProjects(data ?? []))
    })
  }, [session])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Projects</h1>
      {projects.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f5f3f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7a7888" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#18181a' }}>No active projects yet</div>
          <div style={{ fontSize: 12, color: '#7a7888' }}>Your projects will appear here once they're started.</div>
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a' }}>{p.title}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: STATUS_COLORS[p.status]?.bg, color: STATUS_COLORS[p.status]?.text }}>{p.status}</span>
            </div>
            {p.description && <div style={{ fontSize: 13, color: '#7a7888', lineHeight: 1.5 }}>{p.description}</div>}
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#7a7888' }}>
              {p.start_date && <span>Started: {p.start_date}</span>}
              {p.due_date && <span>Due: {p.due_date}</span>}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
