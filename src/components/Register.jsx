import { useState, useEffect } from 'react'
import './Register.css'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [phone, setPhone] = useState('')
  
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [mandals, setMandals] = useState([])
  
  const [stateId, setStateId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [mandalId, setMandalId] = useState('')
  
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpStatus, setOtpStatus] = useState('')
  const [otpError, setOtpError] = useState(null)
  const [isOtpBusy, setIsOtpBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadStates()
  }, [])

  useEffect(() => {
    if (stateId) {
      loadDistricts(stateId)
    } else {
      setDistricts([])
      setMandals([])
      setDistrictId('')
      setMandalId('')
    }
  }, [stateId])

  useEffect(() => {
    if (districtId) {
      loadMandals(districtId)
    } else {
      setMandals([])
      setMandalId('')
    }
  }, [districtId])

  const loadStates = async () => {
    try {
      const data = await api.getStates()
      setStates(data)
    } catch (err) {
      console.error("Failed to load states", err)
    }
  }

  const loadDistricts = async (sid) => {
    try {
      const data = await api.getDistricts(sid)
      setDistricts(data)
      setDistrictId('')
      setMandalId('')
    } catch (err) {
      console.error("Failed to load districts", err)
    }
  }

  const loadMandals = async (did) => {
    try {
      const data = await api.getMandals(did)
      setMandals(data)
      setMandalId('')
    } catch (err) {
      console.error("Failed to load mandals", err)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password.trim() || !fullname.trim() || !phone.trim() || !districtId || !mandalId) {
      setError('Please fill in all fields including location details')
      return
    }
    setIsSubmitting(true)
    try{
      await api.sendOtp(email)
      
      setPendingEmail(email)
      setOtp('')
      setOtpStatus(`We sent a 6-digit OTP to ${email}. It will expire in 10 minutes.`)
      setOtpError(null)
      setOtpModalOpen(true)
    }catch(err){
      setError(err.response?.data?.message || err.message || 'OTP sending failed')
    }finally{
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if(!pendingEmail) return
    if(!otp.trim()){
      setOtpError('Please enter the code you received')
      return
    }
    setIsOtpBusy(true)
    setOtpError(null)
    try{
      await api.verifyOtp(pendingEmail, otp.trim())
      
      await api.register({ 
        email: pendingEmail, 
        name: fullname, 
        password, 
        phone, 
        districtId: parseInt(districtId), 
        mandalId: parseInt(mandalId) 
      })
      
      alert('Registration successful! You can now log in.')
      setOtpModalOpen(false)
      navigate('/')
    }catch(err){
      setOtpError(err.response?.data?.message || err.message || 'Verification or registration failed')
    }finally{
      setIsOtpBusy(false)
    }
  }

  const handleResendOtp = async () => {
    if(!pendingEmail) return
    setIsOtpBusy(true)
    setOtpError(null)
    try{
      await api.sendOtp(pendingEmail)
      setOtpStatus(`A new OTP was sent to ${pendingEmail}`)
    }catch(err){
      setOtpError(err.message || 'Could not resend OTP')
    }finally{
      setIsOtpBusy(false)
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
          <h2>Create account</h2>
          <p style={{marginTop:6, marginBottom:12, color:'#64748b'}}>Register to access local civic services and track requests</p>
          <form onSubmit={submit}>
            <div><label>Full Name</label><input value={fullname} required onChange={e=>setFullname(e.target.value)} /></div>
            <div><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label>Phone</label><input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} /></div>
            <div><label>Password</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
            
            <div style={{display:'flex', gap:'10px'}}>
              <div style={{flex: 1}}>
                <label>State</label>
                <select value={stateId} required onChange={e=>setStateId(e.target.value)}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{flex: 1}}>
                <label>District</label>
                <select value={districtId} required onChange={e=>setDistrictId(e.target.value)} disabled={!stateId}>
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label>Mandal</label>
              <select value={mandalId} required onChange={e=>setMandalId(e.target.value)} disabled={!districtId}>
                <option value="">Select Mandal</option>
                {mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            {error && <div className="error">{error}</div>}
            <div className="helper-row">
              <div style={{textAlign:'left'}}><Link to="/">Already have an account? Login</Link></div>
              <div style={{textAlign:'right'}}></div>
            </div>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending OTP...' : 'Register'}</button>
          </form>
        </div>
      </div>
      {otpModalOpen && (
        <div className="otp-modal">
          <div className="otp-modal__backdrop" onClick={() => !isOtpBusy && setOtpModalOpen(false)}></div>
          <div className="otp-modal__content">
            <h3>Verify your email</h3>
            <p>{otpStatus}</p>
            <form onSubmit={handleVerifyOtp}>
              <label>OTP Code</label>
              <input value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} inputMode="numeric" />
              {otpError && <div className="error">{otpError}</div>}
              <div className="otp-actions">
                <button type="button" onClick={handleResendOtp} disabled={isOtpBusy}>Resend OTP</button>
                <div style={{flex:1}} />
                <button type="submit" disabled={isOtpBusy}>{isOtpBusy ? 'Working...' : 'Verify OTP'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
