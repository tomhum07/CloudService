const assert = require('assert');
const fs = require('fs');
const path = require('path');
const testDb = path.join(__dirname, 'test-db.json');
process.env.DATA_FILE = testDb;
const server = require('../server');

(async()=>{
  if(fs.existsSync(testDb)) fs.unlinkSync(testDb);
  await new Promise(resolve=>server.listen(0,resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const request=(url,options={})=>fetch(base+url,{headers:{'Content-Type':'application/json'},...options});
  let res=await request('/api/order-requests',{method:'POST',body:JSON.stringify({fullName:'Nguyễn An',phone:'0900000000',service:'Thiết kế website'})});
  assert.equal(res.status,201); const order=await res.json(); assert.equal(order.status,'pending');
  res=await request(`/api/order-requests/${order.id}/status`,{method:'PATCH',body:JSON.stringify({status:'approved'})});
  assert.equal((await res.json()).status,'approved');
  res=await request('/api/affiliates',{method:'POST',body:JSON.stringify({fullName:'Trần Bình',phone:'0911111111',email:'binh@example.com',channel:'TikTok'})});
  assert.equal(res.status,201);
  res=await request('/api/affiliates'); assert.equal((await res.json()).length,1);
  server.close(); if(fs.existsSync(testDb)) fs.unlinkSync(testDb);
  console.log('✓ Tất cả API hoạt động đúng');
})().catch(err=>{console.error(err);server.close();process.exit(1)});
