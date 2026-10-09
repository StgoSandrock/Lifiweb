const origin=process.env.LIFI_SITE_URL || 'https://www.lifiweb.app';
if(!/^https:\/\//.test(origin))throw new Error('LIFI_SITE_URL must use HTTPS');
const paths=['/api/health','/','/liga','/lifi-cup','/lff','/gestion','/privacidad'];
let failed=false;
for(const path of paths){try{const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);if(path==='/api/health'){const data=await response.json();if(data.status!=='ok'||data.service!=='lifiweb')throw new Error('Unexpected health payload');}console.log(`OK ${path}`);}catch(error){failed=true;console.error(`FAIL ${path}: ${error.message}`);}}
if(failed)process.exitCode=1;
