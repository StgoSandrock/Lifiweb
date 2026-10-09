// Disposable local authentication only. Explicit loopback URLs cannot reach production.
const endpoint='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts';
async function post(action, data, admin=false) {const r=await fetch(`${endpoint}:${action}?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer owner'}:{})},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw new Error(JSON.stringify(j));return j;}
const account=await post('signUp',{email:'owner@example.com',password:'LocalTest2026!',returnSecureToken:true});
await post('update',{localId:account.localId,emailVerified:true,customAttributes:JSON.stringify({staff:true})},true);
console.log('Local-only verified Staff test account is ready.');
