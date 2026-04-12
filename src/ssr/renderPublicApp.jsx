import { renderToString } from 'react-dom/server'
import { Routes, StaticRouter } from 'react-router-dom'
import { AuthContext } from '../lib/authContext'
import { PublicRoutes } from '../routes/PublicRoutes'

export function renderPublicApp({ url, initialPosts, initialPost, initialRelated } = {}) {
  return renderToString(
    <AuthContext.Provider value={null}>
      <StaticRouter location={url || '/'}>
        <Routes>
          {PublicRoutes({ initialPosts, initialPost, initialRelated })}
        </Routes>
      </StaticRouter>
    </AuthContext.Provider>,
  )
}
