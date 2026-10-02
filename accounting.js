(() => {
  'use strict';
  const KEY = '97pueansao.income.v1';
  const $ = id => document.getElementById(id);
  const money = cents => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100);
  const dateKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const today = dateKey(new Date());
  const formatDate = value => new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(value + 'T12:00:00+07:00'));

  let records = [], editing = null, deleting = null, writable = false;
  let store = null, owner = null, busy = false, epoch = 0;
  function message(text, error=false) { $('message').textContent=text; $('message').classList.toggle('error',error); }
  function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01' && value <= '9999-12-31' && dateKey(new Date(value + 'T12:00:00+07:00')) === value; }
  function validRecords(value) {
    return Array.isArray(value) && value.length <= 100000 && new Set(value.map(r => r?.id)).size === value.length && value.every(r => r && typeof r.id === 'string' && r.id.length > 0 && r.id.length < 100 && validDate(r.date) && Number.isInteger(r.customer) && r.customer >= 1 && r.customer <= 999 && typeof r.service === 'string' && r.service.length > 0 && r.service.length <= 100 && Number.isSafeInteger(r.cents) && r.cents >= 0 && r.cents <= 999999900 && typeof r.note === 'string' && r.note.length <= 200);
  }

  function errorText(error) {
    if (['42P01','PGRST205'].includes(error.code)) return 'ยังไม่ได้สร้างตารางบัญชี กรุณารันไฟล์ supabase-accounting-setup.sql ใน Supabase แล้วกดโหลดข้อมูลล่าสุด';
    if (error.code === '42501') return 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาตรวจสอบการเข้าสู่ระบบและตั้งค่าฐานข้อมูล';
    if (['CONFLICT','LIMIT'].includes(error.code)) return error.message;
    return 'ติดต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วโหลดข้อมูลล่าสุดก่อนลองอีกครั้ง';
  }
  function controls() {
    const blocked=!writable || busy || !window.accountingAuthorized?.();
    $('entryForm').inert=blocked;
    for(const id of ['save','import','migrate','confirmDelete']) $(id).disabled=blocked;
    $('backup').disabled=blocked;
    $('refresh').disabled=busy || !owner;
    for(const button of $('rows').querySelectorAll('button')) button.disabled=blocked;
    $('dbStatus').textContent=busy?'กำลังเชื่อมต่อ…':writable?'เชื่อมต่อฐานข้อมูลแล้ว':'ยังไม่พร้อมใช้งาน';
  }
  function customers(selected = 1) { $('customer').replaceChildren(); for (let n = 1; n <= Math.min(999, Math.max(10, selected, ...records.filter(r => r.date === $('date').value).map(r => r.customer + 1))); n++) { const o = new Option('ลูกค้าคนที่ ' + n, n); $('customer').add(o); } $('customer').value = selected; }
  function reset() { editing = null; $('entryForm').reset(); $('date').value = today; customers(); $('formTitle').textContent = 'บันทึกรายรับ'; $('save').textContent = 'บันทึกรายการ'; $('cancel').hidden = true; }
  function cell(row, text, className) { const td = document.createElement('td'); td.textContent = text; if (className) td.className = className; row.append(td); return td; }
  function render() {
    const month = $('month').value; const selected = records.filter(r => r.date.startsWith(month));
    const sum = list => list.reduce((total, r) => total + r.cents, 0); const daily = records.filter(r => r.date === today); const total = sum(selected);
    $('todayTotal').textContent = money(sum(daily)); $('todayCount').textContent = daily.length + ' รายการ'; $('monthTotal').textContent = money(total); $('monthCount').textContent = selected.length; $('average').textContent = money(selected.length ? Math.round(total / selected.length) : 0); $('monthLabel').textContent = month;
    $('resultCount').textContent = selected.length + ' รายการ'; $('tableTotal').textContent = 'รวม ' + money(total); $('rows').replaceChildren();
    for (const record of [...selected].sort((a, b) => b.date.localeCompare(a.date) || a.customer - b.customer)) {
      const tr = document.createElement('tr'); cell(tr, formatDate(record.date)); cell(tr, 'คนที่ ' + record.customer); const service = cell(tr, record.service); if (record.note) { const note = document.createElement('small'); note.textContent = record.note; service.append(note); } cell(tr, money(record.cents), 'amount'); const actions = cell(tr, ''); const group = document.createElement('div'); group.className = 'actions'; actions.append(group);
      for (const [action, label] of [['edit', 'แก้ไข'], ['delete', 'ลบ']]) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.className = action; button.dataset.id = record.id; button.dataset.action = action; button.setAttribute('aria-label', label + ' ลูกค้าคนที่ ' + record.customer + ' ' + formatDate(record.date)); button.disabled = !writable; group.append(button); } $('rows').append(tr);
    }
    if (!selected.length) { const tr = document.createElement('tr'); const td = cell(tr, 'ยังไม่มีรายการในเดือนนี้ เริ่มบันทึกรายรับได้ที่แบบฟอร์ม', 'empty'); td.colSpan = 5; $('rows').append(tr); }
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today + 'T12:00:00+07:00'); d.setUTCDate(d.getUTCDate() - 6 + i); const key = dateKey(d); return { key, total: sum(records.filter(r => r.date === key)) }; }); const max = Math.max(1, ...days.map(d => d.total)); $('chart').replaceChildren();
    for (const d of days) { const day = document.createElement('div'); day.className = 'day'; day.setAttribute('aria-label', formatDate(d.key) + ' ' + money(d.total)); const value = document.createElement('b'); value.textContent = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(d.total / 100); const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = (d.total / max * 92 + 2) + 'px'; const label = document.createElement('span'); label.textContent = d.key.slice(8) + '/' + d.key.slice(5, 7); day.append(value, bar, label); $('chart').append(day); }
    $('save').disabled = !writable;
  }

  function paint(){render();controls();}
  function localNotice() {
    try { const raw=localStorage.getItem(KEY); const data=raw?JSON.parse(raw):[];
      $('localMigration').hidden=!data.length;
      $('localCount').textContent=validRecords(data)?'พบข้อมูลเดิมในเครื่อง '+data.length+' รายการ เลือกย้ายเข้าบัญชีที่กำลังใช้งานได้ (ข้อมูลเดิมยังเก็บไว้)':'อ่านข้อมูลเดิมไม่ได้ กรุณาใช้ไฟล์สำรอง';
    } catch { $('localMigration').hidden=false; $('localCount').textContent='อ่านข้อมูลเดิมไม่ได้ กรุณาใช้ไฟล์สำรอง'; }
  }
  async function reload() {
    if(!store || busy)return;
    const token=epoch, db=store;busy=true;writable=false;controls();message('กำลังโหลดข้อมูลจากฐานข้อมูล…');
    try { const loaded=await db.load();if(token!==epoch)return;if(!validRecords(loaded))throw new Error('invalid');records=loaded;writable=true;reset();message('โหลดข้อมูลล่าสุดแล้ว'); }
    catch(error){if(token===epoch){records=[];message(errorText(error),true);}}
    finally{if(token===epoch){busy=false;paint();localNotice();}}
  }
  window.accountingClear=()=>{epoch++;owner=null;store=null;records=[];writable=false;busy=false;reset();paint();};
  window.accountingSetUser=async(client,user)=>{
    if(owner===user.id && (writable||busy))return;
    window.accountingClear();owner=user.id;store=window.createAccountingStore(client,user.id);await reload();
  };
  async function mutate(operation,onSuccess) {
    if(!writable || busy || !store || !window.accountingAuthorized?.())return;
    const token=epoch,db=store;busy=true;controls();message('กำลังบันทึกลงฐานข้อมูล…');
    try { const result=await operation(db);if(token!==epoch)return;onSuccess(result); }
    catch(error){if(token===epoch){writable=false;message(errorText(error)+' หากการเชื่อมต่อขาดระหว่างบันทึก ให้ตรวจรายการล่าสุดก่อนบันทึกซ้ำ',true);}}
    finally{if(token===epoch){busy=false;paint();}}
  }
  $('month').value=today.slice(0,7);$('todayLabel').textContent='ภาพรวมรายรับ · '+formatDate(today);reset();paint();
  $('refresh').addEventListener('click',reload);
  $('date').addEventListener('change',()=>customers(Number($('customer').value)||1));
  $('month').addEventListener('change',()=>{if(!$('month').value)$('month').value=today.slice(0,7);paint();});
  $('cancel').addEventListener('click',reset);
  $('entryForm').addEventListener('submit',async event=>{
    event.preventDefault();if(!writable || busy || !$('entryForm').reportValidity())return;
    const previous=editing?records.find(r=>r.id===editing):null;
    const record={id:editing||(globalThis.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(36).slice(2)),date:$('date').value,customer:Number($('customer').value),service:$('service').value,cents:Math.round(Number($('price').value)*100),note:$('note').value.trim()};
    if(!validRecords([record])){message('กรุณาตรวจสอบวันที่ ลูกค้า และราคา',true);return;}
    await mutate(db=>db.save(record,previous),saved=>{
      records=previous?records.map(r=>r.id===saved.id?saved:r):[...records,saved];
      reset();$('date').value=saved.date;customers(Math.min(999,saved.customer+1));$('month').value=saved.date.slice(0,7);message('บันทึกลงฐานข้อมูลแล้ว · '+money(saved.cents));
    });
  });
  $('rows').addEventListener('click', event => {
    if(!writable || busy)return;
    const button = event.target.closest('button[data-id]'); if (!button) return; const r = records.find(r => r.id === button.dataset.id); if (!r) return;
    if (button.dataset.action === 'edit') { editing = r.id; $('date').value = r.date; customers(r.customer); if (![...$('service').options].some(o => o.value === r.service)) $('service').add(new Option(r.service, r.service)); $('service').value = r.service; $('price').value = (r.cents / 100).toFixed(2); $('note').value = r.note; $('formTitle').textContent = 'แก้ไขรายรับ'; $('save').textContent = 'บันทึกการแก้ไข'; $('cancel').hidden = false; $('date').focus(); }
    else { deleting = r.id; $('deleteSummary').textContent = formatDate(r.date) + ' · ลูกค้าคนที่ ' + r.customer + ' · ' + money(r.cents); $('deleteDialog').showModal(); }
  });

  $('keep').addEventListener('click',()=>$('deleteDialog').close());
  $('confirmDelete').addEventListener('click',async()=>{
    const record=records.find(r=>r.id===deleting);if(!record)return;
    await mutate(db=>db.remove(record),()=>{records=records.filter(r=>r.id!==record.id);if(editing===record.id)reset();$('deleteDialog').close();message('ลบรายการจากฐานข้อมูลแล้ว');});
  });
  $('backup').addEventListener('click',()=>{
    if(!writable||busy||!window.accountingAuthorized?.())return;
    const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='97pueansao-income-'+today+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  async function importRecords(data){
    if(!validRecords(data)){message('ข้อมูลนำเข้าไม่ถูกต้อง กรุณาเลือกไฟล์สำรองจากระบบนี้',true);return;}
    await mutate(async db=>{const count=await db.import(data);const loaded=await db.load();if(!validRecords(loaded))throw new Error('invalid');return {count,loaded};},result=>{
      records=result.loaded;message('นำเข้าเพิ่ม '+result.count+' รายการในฐานข้อมูลแล้ว (ข้ามรหัสรายการที่มีอยู่)');localNotice();
    });
  }
  $('import').addEventListener('change',async event=>{
    const file=event.target.files[0],token=epoch;if(!file)return;
    try{if(file.size>20000000)throw new Error();const data=JSON.parse(await file.text());if(token!==epoch)return;if(data.version!==1)throw new Error();await importRecords(data.records);}
    catch{if(token===epoch)message('นำเข้าไม่สำเร็จ กรุณาเลือกไฟล์สำรอง JSON ที่ถูกต้อง',true);}finally{event.target.value='';}
  });
  $('migrate').addEventListener('click',async()=>{
    try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');await importRecords(data);}
    catch{message('อ่านข้อมูลเดิมไม่ได้ ข้อมูลเดิมยังเก็บไว้ กรุณานำเข้าไฟล์สำรองแทน',true);}
  });
})();
