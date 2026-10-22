(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const statusNames = ['Request received','Waiting for pharmacist review','Approved — preparing order','Ready for dispatch','Out for delivery','Ready for pickup','Delivered'];
  const stock = [
    {name:'Paracetamol 500 mg', form:'Tablet', price:28, availability:'In stock*'},
    {name:'Oral rehydration salts', form:'Sachet', price:22, availability:'Limited*'},
    {name:'Antacid chewable', form:'Tablet', price:35, availability:'Check availability*'},
    {name:'Cetirizine 10 mg', form:'Tablet', price:18, availability:'In stock*'},
    {name:'Cough lozenges', form:'Lozenge', price:42, availability:'In stock*'}
  ];
  let requests = [
    {id:'CC-24081', name:'Oral rehydration salts × 1', block:'Block A', pickup:'Block A lobby', time:'Today, 10:24 AM', status:1, price:22, symptom:'Feeling weak since this morning.', type:'Known medicine'},
    {id:'CC-24076', name:'Paracetamol 500 mg × 1', block:'Block C', pickup:'Block C courtyard', time:'Today, 9:48 AM', status:3, price:28, symptom:'', type:'Known medicine'}
  ];
  let cart = {};
  const safe = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2800)}
  function renderOrders(){
    $('#orderCount').textContent=requests.length;
    $('#ordersList').innerHTML=requests.slice().reverse().map(o=>{
      const cls=o.status>=5?'ready':o.status===2?'approved':o.status===6?'delivered':'';
      return `<article class="order-card"><div><div class="order-title">${safe(o.name)}</div><div class="order-meta">${safe(o.id)} · ${safe(o.time)}</div></div><span class="order-status ${cls}">${safe(statusNames[o.status])}</span><div class="order-details"><span>⌖ ${safe(o.block)} · ${safe(o.pickup)}</span><button data-track="${safe(o.id)}">Track request →</button></div></article>`
    }).join('');
  }
  function renderCart(){
    const entries=Object.entries(cart);const host=$('#cartItems');
    if(!entries.length){host.innerHTML='';$('#reviewOrder').disabled=true;$('#reviewOrder').innerHTML='Continue to request <span>→</span>';return}
    const total=entries.reduce((a,[n,q])=>a+stock.find(x=>x.name===n).price*q,0);
    host.innerHTML=entries.map(([n,q])=>`<div class="cart-line"><b>${safe(n)}</b><input aria-label="Quantity for ${safe(n)}" data-qty="${safe(n)}" type="number" min="1" max="10" value="${q}"><button aria-label="Remove ${safe(n)}" data-remove="${safe(n)}">×</button></div>`).join('')+`<div class="cart-total">Estimated total: <b>₹${total}</b> · subject to pharmacist confirmation</div>`;
    $('#reviewOrder').disabled=false;$('#reviewOrder').innerHTML='Submit medicine request <span>→</span>';
  }
  function addMedicine(name){cart[name]=(cart[name]||0)+1;renderCart();toast(`${name} added to your request`)}
  $$('.add-med').forEach(b=>b.addEventListener('click',()=>addMedicine(b.dataset.med)));
  $('#cartItems').addEventListener('click',e=>{const n=e.target.dataset.remove;if(n){delete cart[n];renderCart()}});
  $('#cartItems').addEventListener('change',e=>{const n=e.target.dataset.qty;if(n){const q=Math.max(1,Math.min(10,Number(e.target.value)||1));cart[n]=q;renderCart()}});
  const search=$('#medicineSearch'), results=$('#medicineResults');
  search.addEventListener('input',()=>{
    const q=search.value.trim().toLowerCase();
    if(!q){results.innerHTML='';return}
    const matches=stock.filter(m=>m.name.toLowerCase().includes(q));
    results.innerHTML=matches.length?matches.map(m=>`<button class="medicine-result" data-searchmed="${safe(m.name)}">${safe(m.name)} <span style="float:right;color:#789">${safe(m.availability)}</span></button>`).join(''):'<div class="medicine-result">No sample catalog match. You may describe what you need below.</div>';
  });
  results.addEventListener('click',e=>{const n=e.target.closest('[data-searchmed]')?.dataset.searchmed;if(n){addMedicine(n);search.value='';results.innerHTML=''}});
  $('#searchClear').addEventListener('click',()=>{search.value='';results.innerHTML='';search.focus()});
  let attachment=null;
  $('#supportingFile').addEventListener('change',e=>{
    const f=e.target.files[0];if(!f)return;
    if(!['image/jpeg','image/png','application/pdf'].includes(f.type)){e.target.value='';toast('Please choose a JPG, PNG or PDF file.');return}
    if(f.size>8*1024*1024){e.target.value='';toast('That file is larger than 8 MB.');return}
    attachment=f;
    const host=$('#filePreview');
    host.innerHTML=`${safe(f.name)} <button type="button" id="removeFile" aria-label="Remove attachment">×</button>`;
    $('#removeFile').addEventListener('click',()=>{attachment=null;e.target.value='';host.textContent=''});
  });
  function newRequest({name,symptom='',block,pickup,price=0,type}){
    const o={id:`CC-${Math.floor(25000+Math.random()*74999)}`,name,block,pickup,time:'Just now',status:1,price,symptom,type,attachment:attachment?.name||''};
    requests.push(o);renderOrders();return o;
  }
  function showConfirmation(o){
    $('#modalText').textContent='Your request is in the demo queue for pharmacist review. A submission does not diagnose a condition or guarantee that a medicine will be supplied.';
    $('#modalOrder').innerHTML=`<b>${safe(o.id)}</b> · ${safe(o.name)}<br>${safe(o.block)} · ${safe(o.pickup)}${o.attachment?`<br>Attachment: ${safe(o.attachment)}`:''}<br><span style="color:#7c929e">Status: Waiting for pharmacist review</span>`;
    $('#modal').classList.add('show');
  }
  $('#symptomForm').addEventListener('submit',e=>{
    e.preventDefault();const text=$('#symptoms').value.trim();const error=$('#formError');
    if(!text&&!attachment){error.textContent='Add a symptom description or use the known-medicine request.';return}
    if(!$('#consent').checked){error.textContent='Please confirm consent before sharing your request with pharmacy staff.';return}
    const urgent=/chest pain|can't breathe|cannot breathe|difficulty breathing|unconscious|severe bleeding|seizure|suicid|severe allergic/i.test(text);
    if(urgent){error.textContent='These symptoms may need urgent attention. Contact campus medical staff or emergency services now.';return}
    error.textContent='';const block=$('#blockSelect').value,pickup=$('#pickupSelect').value;
    const o=newRequest({name:text?'Symptom review request':'Supporting information request',symptom:text,block,pickup,type:'Symptom review'});
    $('#symptoms').value='';$('#consent').checked=false;attachment=null;$('#supportingFile').value='';$('#filePreview').textContent='';showConfirmation(o);renderStaff();
  });
  $('#reviewOrder').addEventListener('click',()=>{
    if(!Object.keys(cart).length)return;
    if(!$('#consent').checked){toast('Please confirm consent in the request form below before submitting.');$('#consent').focus();return}
    const names=Object.entries(cart).map(([n,q])=>`${n} × ${q}`).join(', ');
    const price=Object.entries(cart).reduce((a,[n,q])=>a+stock.find(x=>x.name===n).price*q,0);
    const o=newRequest({name:names,block:$('#blockSelect').value,pickup:$('#pickupSelect').value,price,type:'Known medicine'});
    cart={};renderCart();$('#consent').checked=false;showConfirmation(o);renderStaff();
  });
  $('#modalClose').addEventListener('click',()=>$('#modal').classList.remove('show'));
  $('#modalDone').addEventListener('click',()=>{$('#modal').classList.remove('show');$('#orders').scrollIntoView({behavior:'smooth'})});
  $('#modal').addEventListener('click',e=>{if(e.target.id==='modal')$('#modal').classList.remove('show')});
  $('#ordersList').addEventListener('click',e=>{const id=e.target.dataset.track;if(!id)return;const o=requests.find(x=>x.id===id);toast(`${o.id}: ${statusNames[o.status]} · ${o.block}`)});
  $('#blockSelect').addEventListener('change',e=>{
    const choices={'Block A':['Block A lobby','Library entrance','East gate kiosk'],'Block B':['Library entrance','Block B lobby','Student center','East gate kiosk'],'Block C':['Block C courtyard','Library entrance','Student center'],'Block D':['Block D reception','East gate kiosk','Library entrance']};
    const sel=$('#pickupSelect');sel.innerHTML=choices[e.target.value].map(x=>`<option>${safe(x)}</option>`).join('');
  });
  $('#mapBtn').addEventListener('click',()=>toast('Campus guide: Apollo Pharmacy is beside the main academic block. Sample map, not to scale.'));
  $('#helpBtn').addEventListener('click',()=>toast('For urgent help, contact campus medical staff or local emergency services. Add verified campus contact details before launch.'));
  $('#notifBtn').addEventListener('click',()=>toast(requests.some(o=>o.status<2)?'You have requests waiting for pharmacist review.':'No new updates in this demo.'));
  $('#allOrders').addEventListener('click',()=>toast(`Showing ${requests.length} requests from this demo session.`));
  $('#menuBtn').addEventListener('click',()=>toast('Use the links in the bottom navigation to move around.'));
  // Demo staff console: visibly labelled simulation; no sign-in or server authorization is implemented.
  const staff=document.createElement('section');staff.id='staffDemo';staff.className='staff-demo';staff.innerHTML=`<div class="section-heading"><div><span class="eyebrow muted">WORKFLOW PREVIEW · SYNTHETIC DATA</span><h2>Staff workflow demo</h2></div><select id="roleView" aria-label="Choose demo role"><option value="pharmacy">Pharmacy staff view</option><option value="runner">EV runner view</option></select></div><div class="staff-warning">Demo role views only — this page has no login, backend, or access controls. Do not enter real health information.</div><div id="staffQueue"></div>`;
  $('#orders').after(staff);
  const role=$('#roleView');role.addEventListener('change',renderStaff);
  function renderStaff(){
    const host=$('#staffQueue'), runner=role.value==='runner';
    const active=requests.filter(o=>o.status<6);
    if(!active.length){host.innerHTML='<div class="staff-empty">No active demo requests.</div>';return}
    host.innerHTML=active.slice().reverse().map(o=>{
      const canProgress=o.status<6;
      const next=runner?Math.min(6,Math.max(3,o.status)+1):Math.min(3,o.status+1);
      const action=runner?(o.status<3?'Waiting for pharmacist approval':`Set status: ${statusNames[next]}`):(o.status<2?'Approve request':o.status<3?'Mark ready for dispatch':'Pharmacy status updated');
      return `<article class="staff-row"><div><b>${safe(o.id)} · ${safe(o.name)}</b><small>${safe(o.block)} · ${safe(o.pickup)} · ${safe(o.status===1?'Waiting review':statusNames[o.status])}</small>${!runner&&o.symptom?`<div class="staff-private">Student note: ${safe(o.symptom)}${o.attachment?` · Attachment: ${safe(o.attachment)}`:''}</div>`:''}${runner?'<div class="staff-private">Destination details only · medical details hidden</div>':''}</div><button class="${runner?'secondary':'primary'} staff-action" data-id="${safe(o.id)}" ${canProgress?'':'disabled'}>${safe(action)}</button></article>`
    }).join('');
  }
  $('#staffQueue').addEventListener('click',e=>{
    const id=e.target.dataset.id;if(!id)return;const o=requests.find(x=>x.id===id);if(!o)return;
    if(role.value==='pharmacy'){
      if(o.status===1){o.status=2;toast('Pharmacist approval simulated. Verify stock and prescription requirements in real use.')}
      else if(o.status===2){o.status=3;toast('Order marked ready for dispatch.')}
    } else if(o.status>=2){o.status=Math.min(6,Math.max(3,o.status)+1);toast(`Delivery status updated: ${statusNames[o.status]}`)}
    renderOrders();renderStaff();
  });
  renderOrders();renderStaff();
})();

