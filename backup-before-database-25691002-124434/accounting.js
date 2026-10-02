(() => {
  'use strict';
  if (!window.accountingAuthorized?.()) return;
  const KEY = '97pueansao.income.v1';
  const $ = id => document.getElementById(id);
  const money = cents => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100);
  const dateKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const today = dateKey(new Date());
  const formatDate = value => new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(value + 'T12:00:00+07:00'));
  let records = [], editing = null, deleting = null, writable = true;
  function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
  function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01' && value <= '9999-12-31' && dateKey(new Date(value + 'T12:00:00+07:00')) === value; }
  function validRecords(value) {
    return Array.isArray(value) && value.length <= 100000 && new Set(value.map(r => r?.id)).size === value.length && value.every(r => r && typeof r.id === 'string' && r.id.length > 0 && r.id.length < 100 && validDate(r.date) && Number.isInteger(r.customer) && r.customer >= 1 && r.customer <= 999 && typeof r.service === 'string' && r.service.length > 0 && r.service.length <= 100 && Number.isSafeInteger(r.cents) && r.cents >= 0 && r.cents <= 999999900 && typeof r.note === 'string' && r.note.length <= 200);
  }
  try { const raw = localStorage.getItem(KEY); if (raw !== null) { const data = JSON.parse(raw); if (!validRecords(data)) throw new Error(); records = data; } } catch { writable = false; message('อ่านข้อมูลเดิมไม่ได้ จึงปิดการบันทึกเพื่อป้องกันข้อมูลเดิมถูกทับ กรุณาตรวจสอบการอนุญาตพื้นที่เก็บข้อมูล หรือกู้คืนจากไฟล์สำรอง', true); }
  function persist(next) { if (!window.accountingAuthorized?.()) return false; try { localStorage.setItem(KEY, JSON.stringify(next)); records = next; render(); return true; } catch { message('บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลอาจเต็มหรือเบราว์เซอร์ไม่อนุญาต กรุณาสำรองข้อมูล', true); return false; } }
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
  $('month').value = today.slice(0, 7); $('todayLabel').textContent = 'ภาพรวมรายรับ · ' + formatDate(today); reset(); render();
  $('date').addEventListener('change', () => customers(Number($('customer').value) || 1));
  $('month').addEventListener('change', () => { if (!$('month').value) $('month').value = today.slice(0, 7); render(); });
  $('cancel').addEventListener('click', reset);
  $('entryForm').addEventListener('submit', event => {
    event.preventDefault(); if (!writable || !$('entryForm').reportValidity()) return;
    const record = { id: editing || (globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2)), date: $('date').value, customer: Number($('customer').value), service: $('service').value, cents: Math.round(Number($('price').value) * 100), note: $('note').value.trim() };
    if (!validRecords([record])) { message('กรุณาตรวจสอบวันที่ ลูกค้า และราคา', true); return; } const next = editing ? records.map(r => r.id === editing ? record : r) : [...records, record];
    if (persist(next)) { const savedDate = record.date; reset(); $('date').value = savedDate; customers(Math.min(999, record.customer + 1)); $('month').value = savedDate.slice(0, 7); render(); message('บันทึกเรียบร้อยแล้ว · ' + money(record.cents)); }
  });
  $('rows').addEventListener('click', event => {
    const button = event.target.closest('button[data-id]'); if (!button) return; const r = records.find(r => r.id === button.dataset.id); if (!r) return;
    if (button.dataset.action === 'edit') { editing = r.id; $('date').value = r.date; customers(r.customer); if (![...$('service').options].some(o => o.value === r.service)) $('service').add(new Option(r.service, r.service)); $('service').value = r.service; $('price').value = (r.cents / 100).toFixed(2); $('note').value = r.note; $('formTitle').textContent = 'แก้ไขรายรับ'; $('save').textContent = 'บันทึกการแก้ไข'; $('cancel').hidden = false; $('date').focus(); }
    else { deleting = r.id; $('deleteSummary').textContent = formatDate(r.date) + ' · ลูกค้าคนที่ ' + r.customer + ' · ' + money(r.cents); $('deleteDialog').showModal(); }
  });
  $('keep').addEventListener('click', () => $('deleteDialog').close()); $('confirmDelete').addEventListener('click', () => { if (persist(records.filter(r => r.id !== deleting))) { if (editing === deleting) reset(); message('ลบรายการเรียบร้อยแล้ว'); $('deleteDialog').close(); } });
  $('backup').addEventListener('click', () => { if (!writable) { message('ยังอ่านข้อมูลเดิมไม่ได้ ไม่สามารถสร้างไฟล์สำรองที่ครบถ้วนได้', true); return; } const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '97pueansao-income-' + today + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  $('import').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; try { if (file.size > 20000000) throw new Error(); const data = JSON.parse(await file.text()); if (data.version !== 1 || !validRecords(data.records)) throw new Error(); const existing = new Map(records.map(r => [r.id, r])); let added = 0; for (const r of data.records) { if (!existing.has(r.id)) { existing.set(r.id, r); added++; } } const merged = [...existing.values()]; if (!validRecords(merged)) throw new Error(); if (persist(merged)) { writable = true; render(); message('นำเข้าเพิ่ม ' + added + ' รายการ (รายการรหัสเดิมจะเก็บข้อมูลปัจจุบันไว้)'); } } catch { message('นำเข้าไม่สำเร็จ กรุณาเลือกไฟล์สำรอง JSON จากระบบนี้ที่มีข้อมูลถูกต้อง', true); } event.target.value = ''; });
  window.addEventListener('storage', event => { if (event.key === KEY) { writable = false; $('save').disabled = true; render(); message('ข้อมูลถูกเปลี่ยนจากอีกแท็บ กรุณาโหลดหน้านี้ใหม่ก่อนแก้ไข เพื่อป้องกันข้อมูลทับกัน', true); } });
})();
