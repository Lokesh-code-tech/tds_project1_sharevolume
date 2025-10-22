// Vanilla JS for AMD data dashboard (XBRL, SEC endpoint)
(function(){
  const DEFAULT_CIK = '0000002488';
  const ENDPOINT_BASE = 'https://data.sec.gov/api/xbrl/companyconcept/CIK';

  // Helpers
  function $(sel){ return document.querySelector(sel); }
  function showStatus(msg, isError=false){ const el = $('#status-text'); if(el){ el.textContent = msg; el.style.color = isError ? '#f87171' : '#d1d5db'; } }
  function toNum(v){ const n = Number(v); return isFinite(n) ? n : null; }

  // Parse CIK query param
  function getQueryCIK(){ const p = new URLSearchParams(window.location.search); const v = p.get('CIK'); if(!v) return null; // expect 10-digit numeric
    if(/^[0-9]{10}$/.test(v)) return v; return null; }

  function formatEndpointForCIK(cik10){ // Build: https://data.sec.gov/api/xbrl/companyconcept/CIK0000002488/dei/EntityCommonStockSharesOutstanding.json
    const trimmed = cik10; return ENDPOINT_BASE + trimmed + '/dei/EntityCommonStockSharesOutstanding.json'; }

  // Fetch with graceful fallback via proxy if CORS blocks direct access
  async function fetchWithFallback(url){ try{ const res = await fetch(url, {method:'GET', headers:{'Accept':'application/json'}}); if(res.ok){ try{ return await res.json(); } catch(e){ // maybe text
          const text = await res.text(); return JSON.parse(text); } } } catch(e) { /* fallthrough */ }
    // Try a proxy (very lightweight, no keys). r.jina.ai fetches remote content and returns JSON for many endpoints.
    try{ const proxy = 'https://r.jina.ai/http://' + encodeURIComponent(url); const res2 = await fetch(proxy, {method:'GET'}); if(res2.ok){ const text = await res2.text(); try{ return JSON.parse(text); } catch(e){ throw new Error('Proxy did not return JSON'); } } } catch(e){ throw e; }
    throw new Error('Unable to fetch data from SEC endpoint.');
  }

  function computeMaxMin(shares){ // expects array of {fy, val}
    const valid = (shares||[]).filter(s => s?.fy && s?.val != null && !isNaN(Number(s.val)) && Number(s.fy) > 0);
    const filtered = valid.filter(s => Number(s.fy) > 2020);
    if(filtered.length===0) return {max:null,min:null};
    let max = filtered[0], min = filtered[0];
    for(const s of filtered){ const v = Number(s.val); if(v > Number(max.val)) max = s; if(v < Number(min.val)) min = s; }
    return {max, min};
  }

  function updateUI(entityName, maxObj, minObj){ if(entityName){ $('#share-entity-name').textContent = entityName; document.title = entityName + ' - Shares'; }
    if(maxObj){ $('#share-max-value').textContent = maxObj.val; $('#share-max-fy').textContent = maxObj.fy; } else { $('#share-max-value').textContent = '-'; $('#share-max-fy').textContent = '-'; }
    if(minObj){ $('#share-min-value').textContent = minObj.val; $('#share-min-fy').textContent = minObj.fy; } else { $('#share-min-value').textContent = '-'; $('#share-min-fy').textContent = '-'; }
  }

  function saveDataLocally(obj){ if(!obj) return; try{ localStorage.setItem('data.json', JSON.stringify(obj)); } catch(e){ console.warn('Local storage unavailable'); } }

  async function loadAndRender(cik10){ const endpoint = formatEndpointForCIK(cik10); showStatus('Loading data from SEC...'); try{ const data = await fetchWithFallback(endpoint); if(!data){ throw new Error('No data returned'); }
      const entityName = data?.entityName ?? 'Unknown'; const shares = data?.units?.shares ?? []; const {max, min} = computeMaxMin(shares);
      const payload = { entityName, max: max ? { val: max.val, fy: max.fy } : null, min: min ? { val: min.val, fy: min.fy } : null };
      updateUI(entityName, payload.max, payload.min); saveDataLocally(payload); showStatus('Data loaded.');
    } catch(err){ showStatus('Error loading data. See console.', true); console.error(err); updateUI('Unknown', null, null); }
  }

  // Initialize: try local data first
  function initFromLocal(){ try{ const raw = localStorage.getItem('data.json'); if(raw){ const obj = JSON.parse(raw); updateUI(obj.entityName, obj.max, obj.min); return true; } } catch(e) { /* ignore */ } return false; }

  async function start(){ // Determine CIK and fetch accordingly
    const localOk = initFromLocal(); const cikFromURL = getQueryCIK(); if(cikFromURL){ await loadAndRender(cikFromURL); } else if(localOk){ // data loaded from local
      return; } else { await loadAndRender('0000002488'); }
  }

  // Attach download button handler
  function setupExport(){ const btn = document.getElementById('download-btn'); if(!btn) return; btn.addEventListener('click', ()=>{ try{ const raw = localStorage.getItem('data.json'); if(!raw){ alert('No data.json stored yet.'); return; } const blob = new Blob([raw], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'data.json'; a.click(); URL.revokeObjectURL(a.href); } catch(e){ console.error(e); } }); btn.disabled = false; }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    setupExport();
    start();
  });

})();