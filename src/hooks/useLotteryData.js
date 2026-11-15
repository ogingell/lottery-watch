import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildModel } from '../lib/model'

const json = async (url) => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json() }

/* The app opens on the snapshot bundled with the last deploy, then swaps in the
   live feed as soon as the serverless function answers. If the function cannot
   reach the National Lottery, the snapshot simply stays. */
export function useLotteryData() {
  const [base, setBase] = useState(null)       // { snapshot, procedures, history }
  const [live, setLive] = useState(null)
  const [state, setState] = useState({ loading: true, refreshing: false, error: null, liveError: null })
  const busy = useRef(false)

  const loadLive = useCallback(async (fresh = false) => {
    if (busy.current) return
    busy.current = true
    setState((s) => ({ ...s, refreshing: true }))
    try {
      const body = await json(`/api/lottery${fresh ? `?fresh=${Date.now()}` : ''}`)
      if (!body?.cards?.length) throw new Error('empty')
      setLive(body)
      setState((s) => ({ ...s, refreshing: false, liveError: null }))
    } catch (e) {
      setState((s) => ({ ...s, refreshing: false, liveError: e.message }))
    } finally { busy.current = false }
  }, [])

  useEffect(() => {
    let off = false
    Promise.all([json('/data/snapshot.json'), json('/data/procedures.json').catch(() => ({})), json('/data/history.json').catch(() => null)])
      .then(([snapshot, procedures, history]) => { if (!off) { setBase({ snapshot, procedures, history }); setState((s) => ({ ...s, loading: false })) } })
      .catch((e) => { if (!off) setState((s) => ({ ...s, loading: false, error: e.message })) })
    loadLive()
    return () => { off = true }
  }, [loadLive])

  const model = useMemo(() => {
    const feed = live ?? base?.snapshot
    if (!feed) return null
    // Draw results take many calls upstream: if the live answer came back without them, keep the snapshot's
    const merged = live && !live.draws?.length && base?.snapshot?.draws?.length ? { ...live, draws: base.snapshot.draws } : feed
    return buildModel({ feed: merged, procedures: base?.procedures, history: base?.history })
  }, [base, live])

  return { model, ...state, source: live ? 'live' : 'snapshot', refresh: () => loadLive(true) }
}
