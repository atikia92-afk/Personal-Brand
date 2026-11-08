(() => {
  const copy = {
    fa:{case:'تجربهٔ کاری',article:'یادداشت',read:'خواندن نوشته',problem:'مسئله چه بود؟',solution:'چه کار کردم؟',outcome:'چه نتیجه‌ای حاصل شد؟',empty:'هنوز نوشته‌ای در این دسته منتشر نشده است.',noMatch:'نوشته‌ای با این عبارت پیدا نشد.',unavailable:'بارگذاری نوشته‌ها انجام نشد. دوباره تلاش کنید.',loading:'در حال بارگذاری نوشته‌ها…',draft:'پیش‌نویس',published:'منتشرشده',archived:'بایگانی‌شده',saved:'پیش‌نویس در سایت ذخیره شد.',publishedOk:'نوشته منتشر شد و در بخش نوشته‌ها نمایش داده می‌شود.',archivedOk:'نوشته بایگانی شد؛ از همین بخش می‌توانید دوباره آن را منتشر کنید.',saving:'در حال ذخیره…',titleRequired:'عنوان فارسی باید دست‌کم سه نویسه داشته باشد.',contentIncomplete:'برای انتشار، خلاصه و متن نوشته را کامل کنید. در تجربهٔ کاری، هر سه بخش مسئله، اقدام و نتیجه لازم‌اند.',englishIncomplete:'برای انتشار نسخهٔ انگلیسی، خلاصه و متن انگلیسی را هم کامل کنید.',tooLong:'متن از اندازهٔ مجاز طولانی‌تر است.',forbidden:'حساب شما اجازهٔ مدیریت نوشته‌ها را ندارد.',invalid:'اطلاعات نوشته معتبر نیست.',notFound:'این نوشته پیدا نشد.',newDraft:'نوشتهٔ تازه',unsaved:'هنوز ذخیره نشده',persianDraft:'پیش‌نویس فارسی'},
    en:{case:'WORK STORY',article:'NOTE',read:'Read the story',problem:'The challenge',solution:'My approach',outcome:'The outcome',empty:'No posts have been published in this category yet.',noMatch:'No posts match this search.',unavailable:'Posts could not be loaded. Please try again.',loading:'Loading posts…',draft:'Draft',published:'Published',archived:'Archived',saved:'Your draft has been saved to the site.',publishedOk:'Your post is published and visible in the journal.',archivedOk:'The post is archived. You can publish it again from here.',saving:'Saving…',titleRequired:'The Persian title needs at least three characters.',contentIncomplete:'Complete the summary and content before publishing. Work stories need a challenge, approach and outcome.',englishIncomplete:'Complete the English summary and content to publish the English edition.',tooLong:'The text exceeds the allowed length.',forbidden:'Your account cannot manage posts.',invalid:'The post details are invalid.',notFound:'This post could not be found.',newDraft:'New post',unsaved:'Not saved yet',persianDraft:'Persian draft'}
  };
  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'fa';
  const t = () => copy[lang()];
  const suffix = () => lang()==='fa'?'Fa':'En';
  const byId = id => document.getElementById(id);
  const mode=document.querySelector('[data-page]')?.getAttribute('data-page')??'home';
  const node = (tag, cls, text) => {const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  let posts=[], managed=[], canEdit=false, filter='all', limit=mode==='home'?3:6, busy=false, lastOpener=null;
  const editor=byId('journal-editor'), form=byId('post-form');
  const fields=['title','context','summary','body','problem','solution','outcome'];
  const date = iso => new Intl.DateTimeFormat(lang()==='fa'?'fa-IR':'en-GB',{dateStyle:'medium',timeZone:'Asia/Tehran'}).format(new Date(iso));

  function openDialog(dialog) {lastOpener=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');}
  function errorText(code) {return t()[code]??t().unavailable;}
  async function request(url, options={}) {
    const response=await fetch(url,{credentials:'same-origin',...options});
    let data;try {data=await response.json();} catch {throw new Error('unavailable');}
    if(!response.ok) throw new Error(data.error??'unavailable');
    return data;
  }
  function renderPosts() {
    const grid=byId('journal-grid');if(!grid)return;grid.replaceChildren();
    const query=(byId('journal-search')?.value??'').trim().toLocaleLowerCase();
    const list=posts.filter(post=>post.status==='published'&&post['title'+suffix()]&&(filter==='all'||post.kind===filter)&&(!query||[post['title'+suffix()],post['summary'+suffix()],post['context'+suffix()]].join(' ').toLocaleLowerCase().includes(query)));
    byId('journal-feedback').textContent=list.length?'':(query?t().noMatch:t().empty);
    const more=byId('journal-more');if(more)more.hidden=list.length<=limit;
    list.slice(0,limit).forEach(post=>{
      const card=node('article','journal-card');
      const meta=node('div','journal-card-meta');meta.append(node('span','',t()[post.kind]));
      if(post.publishedAt) {
        const time=node('time','',date(post.publishedAt));
        time.dateTime=post.publishedAt;
        meta.append(time);
      }
      const href='/Personal-Brand/journal/'+encodeURIComponent(post.id)+'/';
      const title=node(mode==='home'?'h3':'h2','');const titleLink=node('a','',post['title'+suffix()]);titleLink.href=href;title.append(titleLink);
      card.append(meta,node('p','journal-card-context',post['context'+suffix()]),title,node('p','journal-card-summary',post['summary'+suffix()]));
      const link=node('a','text-link');link.href=href;
      link.setAttribute('aria-label',t().read+' — '+post['title'+suffix()]);
      const arrow=node('span','direction-arrow','↗');arrow.setAttribute('aria-hidden','true');
      link.append(node('span','',t().read),arrow);
      card.append(link);grid.append(card);
    });
  }
  let loadError, loading=false;
  function renderFeed() {
    if (loading || loadError) byId('journal-feedback').textContent=loading?t().loading:errorText(loadError);
    else renderPosts();
  }
  async function loadPosts() {
    loading=true;loadError=undefined;renderFeed();byId('journal-retry').hidden=true;
    try {const data=await request('/Personal-Brand/data/journal.json');posts=data.posts;canEdit=data.canEdit===true;const manager=byId('manage-journal');if(manager)manager.hidden=!canEdit;}
    catch(error){loadError=error.message;byId('journal-retry').hidden=false;}
    finally {loading=false;renderFeed();}
  }
  function setWritingLanguage(next) {
    document.querySelectorAll('[data-writing-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.writingLang===next)));
    document.querySelectorAll('[data-writing-panel]').forEach(panel=>panel.hidden=panel.dataset.writingPanel!==next);
  }
  function updateKind() {
    const isCase=byId('post-kind').value==='case';
    form.querySelectorAll('.case-fields').forEach(el=>el.hidden=!isCase);form.querySelectorAll('.article-field').forEach(el=>el.hidden=isCase);
  }
  function renderManaged() {
    const list=byId('editor-posts');if(!list)return;list.replaceChildren();
    managed.forEach(post=>{const button=node('button','editor-post');button.type='button';button.classList.toggle('selected',post.id===byId('post-id').value);button.append(node('strong','',post['title'+suffix()]||t().persianDraft),node('span','',t()[post.status]));button.addEventListener('click',()=>fillPost(post));list.append(button);});
  }
  function fillPost(post=null) {
    form.reset();byId('post-id').value=post?.id??'';byId('post-kind').value=post?.kind??'article';
    for(const locale of ['fa','en'])for(const field of fields)byId('post-'+field+'-'+locale).value=post?.[field+(locale==='fa'?'Fa':'En')]??'';
    byId('archive-post').hidden=!post;byId('post-feedback').textContent='';setWritingLanguage('fa');updateKind();renderManaged();
  }
  byId('manage-journal')?.addEventListener('click',async()=>{
    openDialog(editor);byId('post-feedback').textContent=t().loading;
    try {const data=await request('/Personal-Brand/data/journal.json?manage=1');managed=data.posts;fillPost();}
    catch(error){byId('post-feedback').textContent=errorText(error.message);}
  });
  byId('new-post')?.addEventListener('click',()=>{if(!busy){fillPost();byId('post-title-fa').focus();}});
  byId('post-kind')?.addEventListener('change',updateKind);
  document.querySelectorAll('[data-writing-lang]').forEach(button=>button.addEventListener('click',()=>setWritingLanguage(button.dataset.writingLang)));
  form?.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!canEdit)return;
    if(byId('post-title-fa').value.trim().length<3){setWritingLanguage('fa');byId('post-title-fa').focus();byId('post-feedback').textContent=t().titleRequired;return;}
    const payload={id:byId('post-id').value||undefined,kind:byId('post-kind').value,status:event.submitter?.dataset.saveStatus??'draft'};
    for(const locale of ['fa','en'])for(const field of fields)payload[field+(locale==='fa'?'Fa':'En')]=byId('post-'+field+'-'+locale).value;
    busy=true;form.querySelectorAll('button[type="submit"]').forEach(button=>button.disabled=true);byId('post-feedback').textContent=t().saving;
    try {
      const data=await request('/Personal-Brand/data/journal.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const post=data.post;const index=managed.findIndex(item=>item.id===post.id);if(index>=0)managed[index]=post;else managed.unshift(post);
      fillPost(post);byId('post-feedback').textContent=payload.status==='published'?t().publishedOk:payload.status==='archived'?t().archivedOk:t().saved;
      await loadPosts();
    } catch(error){byId('post-feedback').textContent=errorText(error.message);}
    finally{busy=false;form.querySelectorAll('button[type="submit"]').forEach(button=>button.disabled=false);}
  });
  document.querySelectorAll('[data-close-journal]').forEach(button=>button.addEventListener('click',()=>byId(button.dataset.closeJournal).close()));
  for(const dialog of [editor].filter(Boolean)){
    dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');lastOpener?.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
  }
  document.querySelectorAll('[data-journal-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.journalFilter;limit=6;document.querySelectorAll('[data-journal-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));renderFeed();}));
  byId('journal-search')?.addEventListener('input',()=>{limit=6;renderFeed();});byId('journal-retry')?.addEventListener('click',loadPosts);byId('journal-more')?.addEventListener('click',()=>{limit+=6;renderFeed();});
  document.addEventListener('atie-language-change',()=>{renderFeed();renderManaged();});
  loadPosts();
})();
