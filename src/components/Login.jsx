import { useState } from 'react'
import './Login.css'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { Link } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try{
      const res = await api.login({ email, password })
      const token = res.token || res.token
      localStorage.setItem('jwt', token)
      let roleStr = ''
      try {
        // api.js already set local storage in api.login, so we can just use getCurrentUser()
        const user = api.getCurrentUser()
        if(user) {
          localStorage.setItem('user_id', user.userId || user.id || '')
          localStorage.setItem('username', user.sub || user.email || '')
          
          // Spring Boot typically puts roles in 'roles' array or a string
          let roles = user.roles || user.role || []
          roleStr = typeof roles === 'string' ? roles : JSON.stringify(roles)
          localStorage.setItem('role', roleStr)
        }
      } catch (err) {
        console.error('Failed to decode role for redirect', err)
      }
      
  // redirect by role
  if(roleStr && roleStr.includes('ADMIN')) navigate('/admin')
  else if(roleStr && roleStr.includes('OFFICER')) navigate('/officer')
  else navigate('/dashboard')
    }catch(err){
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="auth-container">
      <div className="form-card" style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center'}}>
        <div className="illustration" style={{padding: '6px'}}>
          <img src="/logo.png" alt="Illustration" style={{width:'100%', borderRadius:12}} />
        </div>
        <div>
          <div className="brand">
          <img src="/JustLogo.png" alt="Illustration" style={{width:'100%',height:'100%', borderRadius:12}} />

          </div>
          
          <p style={{marginTop:6, marginBottom:12, color:'#64748b'}}>Sign in to access your dashboard and civic services</p>
          <form onSubmit={submit}>
            <div>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" required value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input required id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            {error && <div className="error">{error}</div>}
            <div className="helper-row">
              <div style={{textAlign:'left'}}><Link to="/register">Create account</Link></div>
              <div style={{textAlign:'right'}}><Link to="#">Forgot?</Link></div>
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  )
}
