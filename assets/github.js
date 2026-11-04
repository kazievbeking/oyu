/* GitHub credentials stay in the password input and request headers, never in exports. */
(()=>{'use strict';
const repository='kazievbeking/oyu';
const apiRoot='https://api.github.com/repos/'+repository;
const keyFields={sections:['id','name_kk','name_ru','name_en','description_kk','description_ru','description_en','image'],items:['id','name','section_id','kind','color','image','subtitle','description','history','meaning','usage','subtitle_kk','description_kk','history_kk','meaning_kk','usage_kk','subtitle_en','description_en','history_en','meaning_en','usage_en']};
function canonical(catalog){
 const normalized={};
 for(const [list,keys]of Object.entries(keyFields))normalized[list]=(catalog[list]||[]).map(row=>Object.fromEntries(keys.map(key=>[key,row[key]||''])));
 return JSON.stringify(normalized);
}
async function publish({token,branch,catalog,baseline,onProgress=()=>{}}){
 if(!token||token.trim().length<15)throw Object.assign(new Error('token'),{code:'token'});
 if(!['https:','http:'].includes(location.protocol))throw Object.assign(new Error('http'),{code:'http'});
 const request=async(path,method='GET',body,accept='application/vnd.github+json')=>{
  const response=await fetch(apiRoot+path,{method,headers:{Accept:accept,Authorization:'Bearer '+token.trim(),'X-GitHub-Api-Version':'2026-03-10',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',...(typeof AbortSignal!=='undefined'&&AbortSignal.timeout?{signal:AbortSignal.timeout(60000)}:{})});
  if(!response.ok){const error=new Error('GitHub '+response.status);error.status=response.status;error.code=response.status===401?'token':response.status===403?'permissions':response.status===409||response.status===422?'conflict':response.status===404?'notfound':'github';throw error;}
  return accept==='application/vnd.github.raw+json'?response.text():response.json();
 };
 onProgress('read');const meta=await request('');const target=branch.trim()||meta.default_branch;
 if(!target||target.startsWith('/')||target.includes('..')||/[\s~^:?*\[\\]/.test(target))throw Object.assign(new Error('branch'),{code:'branch'});
 const refPath='/git/refs/heads/'+target.split('/').map(encodeURIComponent).join('/');
 let ref;
 try{ref=await request('/git/ref/heads/'+target.split('/').map(encodeURIComponent).join('/'));}
 catch(error){
  if(error.status!==409&&error.status!==404)throw error;
  // Only initialise a genuinely empty repository; never create a mistyped branch.
  const branches=await request('/branches?per_page=1');if(branches.length)throw Object.assign(new Error('branch'),{code:'branch'});
  const initial=await request('/contents/.nojekyll','PUT',{message:'Initialise OYU website',content:'',branch:target});ref={object:{sha:initial.commit.sha}};
 }
 const parent=ref.object.sha;const commit=await request('/git/commits/'+encodeURIComponent(parent));const remoteTree=await request('/git/trees/'+encodeURIComponent(commit.tree.sha)+'?recursive=1');
 if(remoteTree.truncated)throw Object.assign(new Error('tree'),{code:'tree'});
 const remoteFile=remoteTree.tree.find(file=>file.path==='data/catalog.json');
 if(remoteFile){const remote=JSON.parse(await request('/contents/data/catalog.json?ref='+encodeURIComponent(parent),'GET',undefined,'application/vnd.github.raw+json'));
  if(canonical(remote)!==canonical(baseline)&&canonical(remote)!==canonical(catalog))throw Object.assign(new Error('catalog conflict'),{code:'catalog-conflict'});
 }
 const files=new Map();const bootstrap=!remoteTree.tree.some(file=>file.path==='index.html');
 if(bootstrap){onProgress('site');const manifestResponse=await fetch('assets/publish-files.json',{cache:'no-store'});if(!manifestResponse.ok)throw Object.assign(new Error('site files'),{code:'site'});const manifest=await manifestResponse.json();
  for(const path of manifest){if(!/^(?:[a-zA-Z0-9_.-]+|(?:assets|uploads)\/[a-zA-Z0-9_./-]+)$/.test(path)||path.includes('..'))throw Error('Invalid site path');if(path==='data/catalog.json'||path==='assets/catalog.js')continue;const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw Object.assign(new Error('site file'),{code:'site'});files.set(path,await response.text());}
 }
 const json=JSON.stringify(catalog,null,2);files.set('data/catalog.json',json);files.set('assets/catalog.js','window.OYU_CATALOG='+json+';');
 onProgress('upload');const tree=[];
 for(const [path,content]of files){const blob=await request('/git/blobs','POST',{content,encoding:'utf-8'});tree.push({path,mode:'100644',type:'blob',sha:blob.sha});}
 const createdTree=await request('/git/trees','POST',{base_tree:commit.tree.sha,tree});
 const next=await request('/git/commits','POST',{message:'Update OYU collection',tree:createdTree.sha,parents:[parent]});
 onProgress('commit');await request(refPath,'PATCH',{sha:next.sha,force:false});
 return {sha:next.sha,branch:target,url:'https://github.com/'+repository+'/commit/'+next.sha,bootstrap};
}
window.OYUGitHub={publish,repository};
})();
