(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let authorized = false, initialized = false, revision = 0, loading;
  window.accountingAuthorized = () => authorized;
  const say = text => { $('authMessage').textContent = text; };
  function lock(text = 'กรุณาเข้าสู่ระบบก่อนดูข้อมูลบัญชี') {
    authorized = false;
    window.accountingClear?.();
    $('accountApp').hidden = true;
    $('accountApp').inert = true;
    $('loginPanel').hidden = false;
    $('accountIdentity').textContent = '';
    $('deleteDialog').close();
    $('accountPassword').value = '';
    say(text);
  }
  // Supabase enforces data ownership; clear the previous user's view on every lock.
  document.addEventListener('click', event => {
    if (!authorized && (event.target.closest('#accountApp') || event.target.closest('#deleteDialog'))) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  if (!window.supabase) { lock('โหลดระบบเข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า'); return; }
  const client = window.supabase.createClient('https://bfavtiawdvrifhnsmsbt.supabase.co', 'sb_publishable_yBX-u-TbyHDOR0FZjTVT1A_V0CqvSPD');
  function loadAccounting() {
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'accounting.js';
      script.onload = resolve; script.onerror = () => { loading = null; script.remove(); reject(new Error('load')); };
      document.head.append(script);
    });
    return loading;
  }
  async function verify() {
    const current = ++revision;
    try {
      const { data, error } = await client.auth.getUser();
      if (current !== revision) return;
      if (error || !data.user) { lock(); return; }
      authorized = true;
      if (!initialized) { await loadAccounting(); initialized = true; }
      if (current !== revision || !authorized) return;
      await window.accountingSetUser(client, data.user);
      if (current !== revision || !authorized) return;
      $('accountIdentity').textContent = data.user.email || 'เข้าสู่ระบบแล้ว';
      $('accountApp').inert = false; $('accountApp').hidden = false; $('loginPanel').hidden = true;
      $('accountPassword').value = '';
    } catch { if (current === revision) lock('เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'); }
  }
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) { revision++; lock('ออกจากระบบแล้ว กรุณาเข้าสู่ระบบเพื่อดูบัญชี'); }
    else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      setTimeout(verify, 0);
    }
  });
  $('accountLoginForm').addEventListener('submit', async event => {
    event.preventDefault(); $('accountLogin').disabled = true; say('กำลังเข้าสู่ระบบ…');
    try {
      const { error } = await client.auth.signInWithPassword({email:$('accountEmail').value.trim(),password:$('accountPassword').value});
      if (error) { lock(error.status === 400 ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่ยืนยันอีเมล' : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'); return; }
      await verify();
    } catch { lock('เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'); }
    finally { $('accountLogin').disabled = false; }
  });
  $('accountLogout').addEventListener('click', async () => {
    revision++; lock('กำลังออกจากระบบ…'); $('accountLogin').disabled = true;
    try { const {error} = await client.auth.signOut({scope:'local'}); say(error ? 'ยังยกเลิกเซสชันไม่สำเร็จ กรุณาเข้าสู่ระบบแล้วลองออกจากระบบอีกครั้ง' : 'ออกจากระบบเรียบร้อยแล้ว'); }
    catch { say('เชื่อมต่อระบบไม่ได้ กรุณาลองออกจากระบบอีกครั้งเมื่อออนไลน์'); }
    finally { $('accountLogin').disabled = false; }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && authorized) { lock('กำลังตรวจสอบการเข้าสู่ระบบ…'); verify(); } });
  window.addEventListener('pageshow', event => { if (event.persisted) { lock(); verify(); } });
  verify().finally(() => { $('accountLogin').disabled = false; });
})();
