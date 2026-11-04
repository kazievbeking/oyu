/* Three language panels keep the existing editor layout compact. */
window.OYUEditorLanguages=function(form,{lang,item,section=false}){
 const labels={kk:{subtitle:'Қысқаша атауы',description:'Сипаттамасы',history:'Тарихы мен дереккөздері',meaning:'Мағынасы',usage:'Қолданылуы',name:'Бөлім атауы'},ru:{subtitle:'Краткое название',description:'Описание',history:'История и источники',meaning:'Значение',usage:'Применение',name:'Название раздела'},en:{subtitle:'Short title',description:'Description',history:'History and sources',meaning:'Meaning',usage:'Usage',name:'Section name'}};
 const strings=labels[lang]||labels.kk;
 const box=section?form.querySelector('.editor-main .admin-box'):form.querySelectorAll('.editor-main .admin-box')[1];
 const heading=box.querySelector('h2').cloneNode(true);box.replaceChildren(heading);
 const tabs=document.createElement('div');tabs.className='editor-language-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',lang==='kk'?'Мәтін тілі':lang==='ru'?'Язык текста':'Text language');box.append(tabs);
 const panels=[];let firstInvalid=null;
 function select(code){for(const entry of panels){const active=entry.code===code;entry.panel.hidden=!active;entry.button.setAttribute('aria-selected',String(active));entry.button.tabIndex=active?0:-1;}}
 for(const [code,name]of [['kk','Қазақша'],['ru','Русский'],['en','English']]){
  const button=document.createElement('button');button.type='button';button.id='text-tab-'+code;button.textContent=name;button.setAttribute('role','tab');button.setAttribute('aria-controls','text-panel-'+code);tabs.append(button);
  const panel=document.createElement('section');panel.id='text-panel-'+code;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.className='editor-language-panel';box.append(panel);panels.push({code,panel,button});button.onclick=()=>select(code);
  const keys=section?['name','description']:['subtitle','description','history','meaning','usage'];
  for(const key of keys){const fieldName=section?`${key}_${code}`:key+(code==='ru'?'':'_'+code);const label=document.createElement('label');label.className='field';const required=section?code==='kk':key==='description';label.append(strings[key]);if(required){const star=document.createElement('span');star.className='required';star.textContent=' *';label.append(star);}
   const input=document.createElement(key==='name'||key==='subtitle'?'input':'textarea');input.name=fieldName;input.lang=code;input.maxLength=key==='name'||key==='subtitle'?200:10000;input.required=required;input.value=item[fieldName]||'';
   input.addEventListener('invalid',()=>{if(!firstInvalid){firstInvalid=input;select(code);setTimeout(()=>{firstInvalid=null;},0);}});label.append(input);panel.append(label);
  }
 }
 tabs.addEventListener('keydown',event=>{const at=panels.findIndex(p=>p.button===document.activeElement);if(at<0)return;let next;if(event.key==='ArrowRight')next=(at+1)%3;else if(event.key==='ArrowLeft')next=(at+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;event.preventDefault();select(panels[next].code);panels[next].button.focus();});
 select('kk');
};
