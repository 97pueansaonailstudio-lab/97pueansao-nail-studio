/* Database access uses the signed-in user's JWT. RLS is enforced by Supabase. */
window.createAccountingStore = (client, ownerId) => {
  const table = 'accounting_entries';
  const fields = 'id,date,customer,service,cents,note,version';
  const payload = r => ({owner_id:ownerId,id:r.id,date:r.date,customer:r.customer,service:r.service,cents:r.cents,note:r.note});
  function check(result) { if (result.error) throw result.error; return result.data; }
  const conflict = () => Object.assign(new Error('รายการถูกเปลี่ยนจากเครื่องอื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนแก้ไขอีกครั้ง'),{code:'CONFLICT'});
  return {
    async load() {
      const rows = []; let cursor = null;
      // Keyset pagination also works when the project's API row limit is below 1,000.
      for (;;) {
        let query = client.from(table).select(fields).eq('owner_id',ownerId).order('id').limit(500);
        if (cursor !== null) query = query.gt('id',cursor);
        const batch = check(await query);
        if (!batch.length) return rows;
        rows.push(...batch); cursor = batch[batch.length-1].id;
        if (rows.length > 100000) throw Object.assign(new Error('ข้อมูลเกิน 100,000 รายการ กรุณาติดต่อผู้ดูแล'),{code:'LIMIT'});
      }
    },
    async save(record, previous) {
      let query;
      if (previous) {
        const {owner_id,id,...changes} = payload(record);
        query = client.from(table).update(changes).eq('owner_id',ownerId).eq('id',id).eq('version',previous.version);
      } else query = client.from(table).insert(payload(record));
      const rows = check(await query.select(fields));
      if (rows.length !== 1) throw conflict();
      return rows[0];
    },
    async remove(record) {
      const rows = check(await client.from(table).delete().eq('owner_id',ownerId).eq('id',record.id).eq('version',record.version).select('id'));
      if (rows.length !== 1) throw conflict();
    },
    async import(records) {
      let count = 0;
      for (let i=0; i<records.length; i+=200) {
        // Never overwrite a newer cloud entry when importing an old backup.
        const rows = check(await client.from(table).upsert(records.slice(i,i+200).map(payload), {onConflict:'owner_id,id',ignoreDuplicates:true}).select('id'));
        count += rows.length;
      }
      return count;
    }
  };
};
