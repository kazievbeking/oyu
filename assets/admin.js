const search=document.querySelector('#admin-search');
const sectionFilter=document.querySelector('#admin-section-filter');
function filterRecords(){let count=0;const term=search.value.toLocaleLowerCase().trim();document.querySelectorAll('.admin-record').forEach(row=>{row.hidden=!row.dataset.name.toLocaleLowerCase().includes(term)||(sectionFilter.value!==''&&sectionFilter.value!==row.dataset.section);if(!row.hidden)count++;});document.querySelector('#admin-empty').hidden=count!==0;}
if(search){search.addEventListener('input',filterRecords);sectionFilter.addEventListener('change',filterRecords);}
document.querySelectorAll('[data-preview]').forEach(input=>{let previousUrl;input.addEventListener('change',()=>{const file=input.files[0];if(!file)return;if(previousUrl)URL.revokeObjectURL(previousUrl);previousUrl=URL.createObjectURL(file);const img=document.createElement('img');img.src=previousUrl;img.alt='';document.getElementById(input.dataset.preview).replaceChildren(img);});});
