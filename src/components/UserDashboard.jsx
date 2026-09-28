import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import ComplaintDetail from './ComplaintDetail'
import FeedbackForm from './FeedbackForm'
import FeedbackList from './FeedbackList'
import StarRating from './StarRating'
import './UserDashboard.css'

function StatusChip({ status }){
  const cls = `chip chip--${(status||'pending').toString().toLowerCase().replace(/\\s+/g,'-')}`
  return <span className={cls}>{status}</span>
}

export default function UserDashboard({ view = 'raise', onSubmitted = () => {} }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [complaints, setComplaints] = useState([])
  const [officers, setOfficers] = useState([])
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)

  // Dynamic Data States
  const [categories, setCategories] = useState([])
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [mandals, setMandals] = useState([])

  // Selection States
  const [categoryId, setCategoryId] = useState('')
  const [stateId, setStateId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [mandalId, setMandalId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')
  const [subCategories, setSubCategories] = useState([])

  useEffect(()=>{ if(view === 'my') loadComplaints() }, [view])

  useEffect(() => {
    loadCategories()
    loadStates()
  }, [])

  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const selected = categories.find(c => String(c.id) === String(categoryId))
      if (selected && selected.subCategories && selected.subCategories.length > 0) {
        setSubCategories(selected.subCategories)
        setSubCategoryId(selected.subCategories[0].id)
      } else {
        setSubCategories([])
        setSubCategoryId('')
      }
    }
  }, [categoryId, categories])

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

  async function loadCategories() {
    try {
      const data = await api.getCategories()
      setCategories(data)
      if (data && data.length > 0) {
        setCategoryId(data[0].id)
      }
    } catch (err) {
      console.error("Failed to load categories", err)
    }
  }

  async function loadStates() {
    try {
      const data = await api.getStates()
      setStates(data)
    } catch (err) {
      console.error("Failed to load states", err)
    }
  }

  async function loadDistricts(sid) {
    try {
      const data = await api.getDistricts(sid)
      setDistricts(data)
      setDistrictId('')
      setMandalId('')
    } catch (err) {
      console.error("Failed to load districts", err)
    }
  }

  async function loadMandals(did) {
    try {
      const data = await api.getMandals(did)
      setMandals(data)
      setMandalId('')
    } catch (err) {
      console.error("Failed to load mandals", err)
    }
  }

  function onFile(e){
    const f = e.target.files && e.target.files[0]
    setImage(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function loadComplaints(){
    try{
      const list = await api.getMyGrievances()
      setComplaints(list || [])
      try{
        const of = await api.getOfficers()
        if(Array.isArray(of)) setOfficers(of)
      }catch(e){ /* ignore if endpoint restricted */ }
    }catch(e){ console.error(e) }
  }

  function resolveOfficerName(c){
    // prefer pre-fetched officers list
    const found = officers.find(o => String(o.id) === String(c.officerId));
    if(found) return found.name;
    // try common payload shapes
    if(c.officerName) return c.officerName;
    if(c.officer && c.officer.name) return c.officer.name;
    // fallback: don't show raw numeric id; show placeholder
    return c.officerId ? `Officer #${c.officerId}` : '-';
  }

  async function submit(e){
    e.preventDefault()
    setError(null)
    if(!title.trim()||!description.trim()) { setError('Please fill title and description'); return }
    if(!categoryId || !mandalId) { setError('Please select Category and Location completely'); return }
    
    const finalCategoryId = subCategoryId ? parseInt(subCategoryId) : parseInt(categoryId);
    
    setLoading(true)
    try{
      const payloadObj = {
        title,
        description,
        address,
        categoryId: finalCategoryId,
        mandalId: parseInt(mandalId)
      }

      const res = await api.submitGrievance({
        ...payloadObj,
        file: image
      })

      setTitle(''); setDescription(''); setImage(null); setPreview(null); setAddress('');
      setCategoryId(categories.length > 0 ? categories[0].id : '')
      setSubCategoryId('')
      setStateId('')
      
      // inform parent to refresh counts/list
      try{ onSubmitted() }catch(e){}
      // switch to My Complaints view if parent doesn't control
      if(view === 'raise') alert('Complaint submitted successfully')
    }catch(err){ setError(err.message || 'Submit failed') }
    setLoading(false)
  }

  return (
    <div className="user-dashboard">
      {/* Render only the active panel to avoid rendering hidden placeholders */}
      {view === 'raise' && (
        <div className="card" id="submit">
          <h3>Submit New Complaint</h3>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-row">
                <label>Title</label>
                <input value={title} required onChange={e=>setTitle(e.target.value)} placeholder="Short, descriptive title" />
              </div>
              <div className="form-row">
                <label>Category</label>
                <select value={categoryId} required onChange={e=>setCategoryId(e.target.value)}>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {subCategories.length > 0 && (
                <div className="form-row">
                  <label>Subcategory</label>
                  <select value={subCategoryId} required onChange={e=>setSubCategoryId(e.target.value)}>
                    {subCategories.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="form-grid">
              <div className="form-row">
                <label>State</label>
                <select value={stateId} required onChange={e=>setStateId(e.target.value)}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>District</label>
                <select value={districtId} required onChange={e=>setDistrictId(e.target.value)} disabled={!stateId}>
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Mandal</label>
                <select value={mandalId} required onChange={e=>setMandalId(e.target.value)} disabled={!districtId}>
                  <option value="">Select Mandal</option>
                  {mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>Address details</label>
              <input placeholder="street address or landmarks" value={address} onChange={e=>setAddress(e.target.value)} />
            </div>

            <div className="form-row">
              <label>Description</label>
              <textarea value={description} required onChange={e=>setDescription(e.target.value)} rows={4} />
            </div>
            
            <div className="form-row">
              <label>Image (Evidence)</label>
              <input type="file" accept="image/*" required onChange={onFile} />
              {preview && <img src={preview} alt="preview" className="file-preview-img" />}
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</button>
          </form>
        </div>
      )}

      {view === 'my' && (
        <div className="card" id="my">
          <h3>My Complaints</h3>
          {complaints.length === 0 ? (
            <div className="muted">No complaints yet</div>
          ) : (
            <>
              {selectedComplaintId ? (
                <div>
                  <ComplaintDetail id={selectedComplaintId} officers={officers} onClose={() => setSelectedComplaintId(null)} />
                </div>
              ) : (
                <div>
                  <ul className="complaint-list">
                    {complaints.map(c => (
                      <li key={c.id} className="complaint-list-item" onClick={() => setSelectedComplaintId(c.id)}>
                        <div className="thumb-small">
                          {c.media && c.media.find(m => m.type === 'AFTER') ? (
                            <img src={c.media.find(m => m.type === 'AFTER').fileUrl} alt={c.title} />
                          ) : c.media && c.media.find(m => m.type === 'BEFORE') ? (
                            <img src={c.media.find(m => m.type === 'BEFORE').fileUrl} alt={c.title} />
                          ) : c.media && c.media.length > 0 ? (
                            <img src={c.media[0].fileUrl} alt={c.title} />
                          ) : (
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>No image</div>
                          )}
                        </div>

                        <div className="list-body">
                          <div className="list-title">{c.title}</div>
                          <div className="list-meta">{c.category?.name || c.category} • {c.priority || '—'}</div>
                          <div className="list-sub">{(c.description || '').length > 140 ? (c.description.slice(0, 140) + '…') : c.description}</div>
                          <div className="list-sub" style={{ marginTop: 6, color: '#64748b' }}>
                            Officer: {resolveOfficerName(c)} • Deadline: {c.deadline || '-'}
                          </div>
                        </div>

                        <div className={`list-status list-status-${(c.status||'').toLowerCase()}`}>{c.status}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}