(function(){
"use strict";
var header=document.getElementById('siteHeader');
addEventListener('scroll',function(){header.classList.toggle('scrolled',scrollY>10)},{passive:true});
var ham=document.getElementById('hamburger'),mm=document.getElementById('mobileMenu'),bd=document.getElementById('menuBackdrop');
function setMenu(open){
  mm.hidden=false;mm.classList.toggle('open',open);bd.hidden=false;bd.classList.toggle('show',open);
  ham.setAttribute('aria-expanded',String(open));ham.setAttribute('aria-label',open?'Close menu':'Open menu');
  document.body.classList.toggle('menu-open',open);
  if(!open)setTimeout(function(){if(!mm.classList.contains('open')){bd.hidden=true}},250);
}
ham.addEventListener('click',function(){setMenu(!mm.classList.contains('open'))});
bd.addEventListener('click',function(){setMenu(false)});
mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
addEventListener('keydown',function(e){if(e.key==='Escape'&&mm.classList.contains('open')){setMenu(false);ham.focus()}});
matchMedia('(min-width:1021px)').addEventListener('change',function(e){if(e.matches)setMenu(false)});

document.querySelectorAll('[data-carousel]').forEach(function(root){
  var track=root.querySelector('.carousel-track'),slides=root.querySelectorAll('.slide'),
      prev=root.querySelector('.c-prev'),next=root.querySelector('.c-next'),
      dotsBox=root.querySelector('.c-dots'),i=0,n=slides.length,timer=null,
      auto=parseInt(root.getAttribute('data-autoplay')||'0',10);
  for(var d=0;d<n;d++){var b=document.createElement('button');b.className='c-dot'+(d===0?' active':'');b.setAttribute('aria-label','Go to slide '+(d+1));b.addEventListener('click',go.bind(null,d));dotsBox.appendChild(b);}
  var dots=dotsBox.children;
  function render(){track.style.transform='translateX(-'+(i*100)+'%)';for(var k=0;k<n;k++)dots[k].classList.toggle('active',k===i);}
  function go(x){i=(x+n)%n;render();restart();}
  function restart(){if(timer)clearInterval(timer);if(auto)timer=setInterval(function(){go(i+1)},auto);}
  prev.addEventListener('click',function(){go(i-1)});next.addEventListener('click',function(){go(i+1)});
  root.addEventListener('mouseenter',function(){if(timer)clearInterval(timer)});
  root.addEventListener('mouseleave',restart);
  var sx=null;
  root.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
  root.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(i+(dx<0?1:-1));sx=null},{passive:true});
  render();restart();
});

/* Product tour video: sources are attached on the first play click, so a visitor
   who never presses play downloads the poster only — no video bytes at all. */
var tourVid=document.getElementById('tourVideo'),tourPlay=document.getElementById('tourPlay');
if(tourVid&&tourPlay){
  var tourShell=tourVid.closest('.video-showcase');
  function tourLoad(){
    if(tourVid.dataset.loaded)return;
    tourVid.dataset.loaded='1';
    tourVid.querySelectorAll('source[data-src]').forEach(function(s){s.src=s.getAttribute('data-src');s.removeAttribute('data-src')});
    tourVid.load();
  }
  function tourStart(){
    tourLoad();tourVid.controls=true;
    var p=tourVid.play();
    if(p&&p.catch)p.catch(function(){});
  }
  tourPlay.addEventListener('click',tourStart);
  document.querySelectorAll('[data-tour-play]').forEach(function(el){
    el.addEventListener('click',function(e){
      e.preventDefault();
      if(tourShell)tourShell.scrollIntoView({behavior:'smooth',block:'center'});
      tourStart();
    });
  });
  tourVid.addEventListener('play',function(){tourShell.classList.add('is-playing')});
  tourVid.addEventListener('pause',function(){tourShell.classList.remove('is-playing')});
  tourVid.addEventListener('ended',function(){tourShell.classList.remove('is-playing')});
}

/* ---- Brand film: scrubbed by scroll -----------------------------------------
   The 20-second film is never played here, it is *seeked*: scroll position inside
   the runway maps to currentTime, so it runs forward as you scroll down and
   backwards as you scroll up, from the first frame to the last and no further.
   On a real pointer the frame is pinned by CSS (position:sticky) inside a 260vh
   runway, which gives the film about 1.6 screen-heights of travel. On touch the
   runway is a normal block and the frame cross-fades its four stills instead of
   seeking — no video byte moves until a finger asks for sound.
   The media query in PINNED must stay identical to the one in global.css. */
(function(){
  var root=document.querySelector('[data-film-scrub]');
  if(!root)return;
  var frame=root.querySelector('.film-frame'),
      video=root.querySelector('[data-film-video]'),
      stills=Array.prototype.slice.call(root.querySelectorAll('[data-film-still]')),
      bar=root.querySelector('[data-film-bar]'),
      clock=root.querySelector('[data-film-clock]'),
      hint=root.querySelector('[data-film-hint]'),
      soundBtn=root.querySelector('[data-film-sound]'),
      box=document.querySelector('[data-film-box]'),
      full=box?box.querySelector('.film-box-video'):null,
      PINNED=matchMedia('(min-width:861px) and (hover:hover) and (pointer:fine)'),
      CALM=matchMedia('(prefers-reduced-motion:reduce)');
  var duration=20,known=false,warmed=false,ready=false,
      lastSeek=-1,lastClock=-1,lastStill=0,pending=null,ticking=false;

  function clamp(v){return v<0?0:v>1?1:v}
  function fmt(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2)}

  /* Nothing is fetched until the section is within two viewports of the
     read-line, and the video is only ever fetched where it can be scrubbed: a
     visitor who never scrolls this far, anyone reading on a phone, and anyone who
     asked for reduced motion all download stills and no film at all. */
  function warm(){
    if(warmed||!PINNED.matches||CALM.matches)return;warmed=true;
    var s=video.querySelector('source[data-src]');
    if(s){s.src=s.getAttribute('data-src');s.removeAttribute('data-src');}
    /* `preload="none"` in the markup keeps the film off the wire until here; once
       we commit to scrubbing, we want the whole 3.2 MB buffered, because every
       scroll tick lands on a different byte range. */
    video.preload='auto';
    video.load();
  }
  if('IntersectionObserver' in window){
    var warms=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){warm();warms.disconnect()}});
    },{rootMargin:'200% 0px'});
    warms.observe(root);
  }

  function sticking(){return PINNED.matches&&document.documentElement.className.indexOf('no-pin')<0}

  /* Scroll -> 0..1. Pinned: the runway's own travel. In flow: the frame crossing
     the viewport, bottom-edge to top-edge. */
  function progress(){
    var r=root.getBoundingClientRect(),vh=innerHeight;
    if(sticking()){
      var travel=root.offsetHeight-vh;
      return travel>0?clamp(-r.top/travel):0;
    }
    var span=vh+r.height;
    return span>0?clamp((vh-r.top)/span):0;
  }

  function seek(t){
    /* Stills only on touch; nothing moves at all under reduced motion. */
    if(!known||!PINNED.matches||CALM.matches)return;
    t=Math.max(0,Math.min(t,duration-.05));
    if(Math.abs(t-lastSeek)<.02)return;
    lastSeek=t;
    if(video.readyState<1){pending=t;return;}
    try{video.currentTime=t}catch(e){}
  }

  var started=false;
  /* Safety net: if the browser refuses to pin the stage (a clipping ancestor, an
     engine without sticky), collapse the runway instead of leaving a screen of
     empty space. The film still scrubs — it just does it as the frame scrolls
     past, the way it does on a phone. Judged once, only from inside the runway. */
  var pinChecked=false;
  function checkPin(){
    if(pinChecked||!PINNED.matches)return;
    var r=root.getBoundingClientRect(),vh=innerHeight;
    if(r.top>-vh*.9||r.bottom<vh*.6)return;   /* not deep enough in, or already past */
    pinChecked=true;
    if(frame.getBoundingClientRect().bottom<vh*.4)document.documentElement.classList.add('no-pin');
  }

  function paint(){
    ticking=false;
    checkPin();
    var p=CALM.matches?0:progress();
    if(!CALM.matches)seek(p*duration);
    bar.style.transform='scaleX('+p+')';
    var startedNow=p>.015;
    if(startedNow!==started){started=startedNow;frame.classList.toggle('is-started',started)}
    var i=Math.min(stills.length-1,Math.floor(p*stills.length));
    if(i!==lastStill){lastStill=i;stills.forEach(function(el,k){el.classList.toggle('is-on',k===i)})}
    var secs=Math.round(p*duration);
    if(secs!==lastClock){lastClock=secs;clock.textContent=fmt(secs)}
  }
  function ask(){if(!ticking){ticking=true;requestAnimationFrame(paint)}}
  /* crossing the pin breakpoint (rotate a tablet, resize a window) can make the
     video worth fetching, or stop it being worth fetching: re-ask each time. */
  if(PINNED.addEventListener)PINNED.addEventListener('change',function(){warm();ask()});
  addEventListener('scroll',ask,{passive:true});
  addEventListener('resize',ask);
  ask();

  video.addEventListener('loadedmetadata',function(){
    if(video.duration&&isFinite(video.duration))duration=video.duration;
    known=true;
    if(pending!==null){lastSeek=-1;seek(pending)}
    else{lastSeek=-1;seek(progress()*duration)}
  });
  video.addEventListener('seeked',function(){
    if(!ready){ready=true;frame.classList.add('is-ready')}
  });
  /* Safari drops the first seek until it has a frame to show: nudge it once. */
  video.addEventListener('loadeddata',function(){lastSeek=-1;seek(progress()*duration)});

  if(CALM.matches&&hint)hint.style.display='none';

  /* "Watch with sound" — the film plays once, properly, in the lightbox, with
     native controls (which also means free fullscreen, captions and scrubbing). */
  function openBox(){
    if(!box||!full)return;
    box.hidden=false;
    requestAnimationFrame(function(){box.classList.add('is-open')});
    document.body.classList.add('film-open');
    var close=box.querySelector('.film-box-close');
    if(close)close.focus();
    var pr=full.play();if(pr&&pr.catch)pr.catch(function(){});
  }
  function closeBox(){
    if(!box||box.hidden)return;
    box.classList.remove('is-open');
    if(full){full.pause();try{full.currentTime=0}catch(e){}}
    document.body.classList.remove('film-open');
    setTimeout(function(){if(!box.classList.contains('is-open'))box.hidden=true},260);
    if(soundBtn)soundBtn.focus();
  }
  if(soundBtn)soundBtn.addEventListener('click',openBox);
  if(box){
    box.querySelectorAll('[data-film-close]').forEach(function(el){el.addEventListener('click',closeBox)});
    addEventListener('keydown',function(e){
      if(e.key==='Escape'){closeBox();return}
      if(e.key!=='Tab'||box.hidden)return;
      var f=box.querySelectorAll('button,[href],video,[tabindex]:not([tabindex="-1"])');
      if(!f.length)return;
      var first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    });
  }
})();

var tSlides=document.querySelectorAll('#tCarousel .t-slide'),ti=0,tt;
function tShow(x){ti=(x+tSlides.length)%tSlides.length;tSlides.forEach(function(s,k){s.classList.toggle('active',k===ti)});}
document.getElementById('tPrev').addEventListener('click',function(){tShow(ti-1);tReset();});
document.getElementById('tNext').addEventListener('click',function(){tShow(ti+1);tReset();});
function tReset(){clearInterval(tt);tt=setInterval(function(){tShow(ti+1)},6500);}tReset();

var counted=false;
function runCounters(){
  document.querySelectorAll('.stat .num').forEach(function(el){
    var target=parseFloat(el.getAttribute('data-count')),dec=parseInt(el.getAttribute('data-decimal')||'0',10),suf=el.getAttribute('data-suffix')||'',t0=null;
    function step(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/1600,1);p=1-Math.pow(1-p,3);el.textContent=(target*p).toFixed(dec)+suf;if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  });
}
var statsObs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!counted){counted=true;runCounters();statsObs.disconnect();}})},{threshold:.4});
var sb=document.querySelector('.stats-bar');if(sb)statsObs.observe(sb);

var revObs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');var t=e.target;setTimeout(function(){t.style.transitionDelay=''},1500);revObs.unobserve(e.target);}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(function(el){revObs.observe(el)});

document.querySelectorAll('.faq-item').forEach(function(item){
  var q=item.querySelector('.faq-q'),a=item.querySelector('.faq-a');
  q.addEventListener('click',function(){
    var open=item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(o){o.classList.remove('open');o.querySelector('.faq-a').style.maxHeight=null;o.querySelector('.faq-q').setAttribute('aria-expanded','false');});
    if(!open){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';q.setAttribute('aria-expanded','true');}
  });
});


var sp=document.getElementById('scrollProgress'),ticking=false;
function onScroll(){var h=document.documentElement.scrollHeight-innerHeight;sp.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
  var fr=document.querySelector('.hero-visual');if(fr&&scrollY<900)fr.style.transform='translateY('+(scrollY*.06)+'px)';ticking=false;}
addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();
document.querySelectorAll('.role-grid,.f-grid,.price-grid,.stats-grid').forEach(function(g){
  Array.prototype.forEach.call(g.children,function(c,k){c.style.transitionDelay=(k*90)+'ms';if(c.classList.contains('reveal'))c.classList.add('zoom');});
});

var mq=document.getElementById('mqTrack');mq.innerHTML+=mq.innerHTML;

// ---- Forms (progressive: posts JSON to PUBLIC_FORM_ENDPOINT, falls back to mailto) ----
document.querySelectorAll('form.lead-form').forEach(function(form){
  var status=form.querySelector('.form-status'),btn=form.querySelector('.form-submit'),lbl=btn.querySelector('.lbl'),orig=lbl.textContent;
  function setErr(name,msg){var el=form.querySelector('[data-err-for="'+name+'"]'),inp=form.elements[name];if(el)el.textContent=msg||'';if(inp&&inp.classList)inp.classList.toggle('invalid',!!msg);if(inp&&inp.setAttribute)inp.setAttribute('aria-invalid',msg?'true':'false');}
  function validate(){
    var ok=true,f=form.elements;
    form.querySelectorAll('[data-err-for]').forEach(function(e){setErr(e.getAttribute('data-err-for'),'')});
    if(f.name&&f.name.value.trim().length<2){setErr('name','Please enter your name.');ok=false}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())){setErr('email','Please enter a valid email address.');ok=false}
    if(f.phone&&f.phone.value&&!/^[0-9+\-\s()]{7,18}$/.test(f.phone.value.trim())){setErr('phone','Enter a valid phone number.');ok=false}
    if(f.institution&&!f.institution.value.trim()){setErr('institution','Please enter your institution.');ok=false}
    if(f.consent&&!f.consent.checked){setErr('consent','Please accept to continue.');ok=false}
    if(!ok){var bad=form.querySelector('.invalid, [data-err-for]:not(:empty)');var fi=form.querySelector('.invalid');if(fi)fi.focus();}
    return ok;
  }
  function say(msg,ok){status.textContent=msg;status.className='form-status '+(ok?'ok':'fail')}
  form.addEventListener('submit',function(e){
    e.preventDefault();status.textContent='';
    if(form.elements.website&&form.elements.website.value)return; // honeypot
    if(!validate())return;
    var data={form:form.getAttribute('data-form'),page:location.href,submittedAt:new Date().toISOString()};
    new FormData(form).forEach(function(v,k){if(k!=='website')data[k]=v});
    var endpoint=form.getAttribute('data-endpoint');
    if(!endpoint){
      var body=Object.keys(data).map(function(k){return k+': '+data[k]}).join('\n');
      location.href='mailto:'+form.getAttribute('data-email')+'?subject='+encodeURIComponent('Sarasvi '+data.form)+'&body='+encodeURIComponent(body);
      say('Opening your email app to send the request…',true);return;
    }
    btn.classList.add('loading');lbl.textContent='Sending…';
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)})
      .then(function(r){if(!r.ok)throw new Error(r.status);form.reset();say(data.form==='newsletter'?'Thanks for subscribing!':'Thank you! Our team will contact you within one working day.',true);})
      .catch(function(){say('Something went wrong. Please try again or email us directly.',false)})
      .finally(function(){btn.classList.remove('loading');lbl.textContent=orig});
  });
});
})();
