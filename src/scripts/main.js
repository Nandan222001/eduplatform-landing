(function(){
"use strict";
/* Everything below is written to survive a page that only has some of these
   elements: the script now runs on every page, including the legal pages that
   have no header, no carousel and no stats bar. An unguarded querySelector here
   used to throw and take the rest of the file - the film included - down with it. */
var header=document.getElementById('siteHeader');
if(header)addEventListener('scroll',function(){header.classList.toggle('scrolled',scrollY>10)},{passive:true});
var ham=document.getElementById('hamburger'),mm=document.getElementById('mobileMenu'),bd=document.getElementById('menuBackdrop');
if(ham&&mm&&bd)menu();
function menu(){
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
}

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

/* ---- Brand film: the background of the whole site, scrubbed by scroll --------
   The whole document is the runway: `scrollY / (document height - viewport)` is
   mapped onto `currentTime`, so the film runs forward as you scroll down, rewinds
   as you scroll back up, and holds its first and last frame at the two ends.
   This is the only place the film moves — it is never "played", so there is no
   third-party player, no autoplay policy, and no sound.
   The video is painted unconditionally (it has a poster, and the markup carries a
   real src) because hiding it behind a flag or a media query is how it went
   missing: an unfetched video must never mean an invisible background. Reduced
   motion and Save-Data/2G readers keep the stills instead, which cross-fade with
   the scroll in its place.
   The wash in front of the film follows the section you are reading: every section
   declares `data-film-wash`, lerped between section centres. */
(function(){
  var layer=document.querySelector('[data-film-bg]');
  if(!layer)return;
  var video=layer.querySelector('[data-film-video]'),
      stills=Array.prototype.slice.call(layer.querySelectorAll('[data-film-still]')),
      ring=document.querySelector('[data-film-ring]'),
      dock=document.querySelector('.film-dock'),
      toggle=document.querySelector('[data-film-toggle]'),
      soundBtn=document.querySelector('[data-film-sound]'),
      box=document.querySelector('[data-film-box]'),
      full=box?box.querySelector('.film-box-video'):null,
      root=document.documentElement,
      TOUCH=matchMedia('(hover:none)'),
      CALM=matchMedia('(prefers-reduced-motion:reduce)'),
      conn=navigator.connection||{},
      /* only the genuinely constrained cases: an explicit Save-Data, or a
         connection Chrome measured as 2G/slow-2G. "3g" is far too eager — it is
         derived from throughput, so ordinary slow Wi-Fi lands in it. */
      DATA=!!conn.saveData||/^(slow-)?2g$/.test(conn.effectiveType||''),
      RING=125.6;   /* 2*pi*20, the ring's circumference */
  var duration=20,known=false,warmed=false,paused=false,held=false,failed=false,
      marks=[],lastSeek=-1,lastStill=-1,lastWash=-1,lastRing=-1,pending=null,ticking=false;

  function clamp(v){return v<0?0:v>1?1:v}

  /* Who keeps the stills instead of the film: readers who asked for stillness, and
     connections that asked not to be loaded. Nobody else — in particular not
     phones, and not narrow windows. */
  function stillsOnly(){return CALM.matches||DATA}

  /* One attribute, on <html>, recording which path the background took. If the
     film is ever "missing" again, this says why in one look:
       <html data-film-mode="video">          scrubbing the film (the normal case)
       <html data-film-mode="reduced-motion"> reader asked for stillness
       <html data-film-mode="save-data">      connection asked not to be loaded
       <html data-film-mode="2g">             connection measured as 2G
       <html data-film-mode="failed">         the file could not be played
       <html data-film-mode="no-js">          never set — the script did not run */
  function mode(){
    return CALM.matches?'reduced-motion':(conn.saveData?'save-data':DATA?'2g':'video');
  }
  function setMode(m){root.setAttribute('data-film-mode',m)}
  setMode(mode());

  /* `preload="none"` in the markup keeps the film off the wire until here; once we
     commit to scrubbing we want the whole file buffered, because every scroll tick
     lands on a different byte range. */
  function warm(){
    if(warmed||stillsOnly())return;warmed=true;
    var s=video.querySelector('source[data-src]');
    if(s){s.src=s.getAttribute('data-src');s.removeAttribute('data-src');}
    video.preload='auto';
    try{video.load()}catch(e){}
  }
  if(document.readyState!=='loading')setTimeout(warm,150);
  else addEventListener('DOMContentLoaded',function(){setTimeout(warm,150)});
  /* belt and braces: if DOMContentLoaded has already been and gone, or never
     fires, the film still gets its turn. */
  setTimeout(warm,1500);

  /* Wash marks: every section that declares one, at its own centre. */
  function measure(){
    var all=document.querySelectorAll('[data-film-wash]'),y=scrollY;
    marks=[];
    Array.prototype.forEach.call(all,function(el){
      var r=el.getBoundingClientRect(),a=parseFloat(el.getAttribute('data-film-wash'));
      if(!isFinite(a))return;
      marks.push({y:y+r.top+r.height/2,a:a});
    });
    marks.sort(function(p,q){return p.y-q.y});
  }
  function washFor(centre){
    if(!marks.length)return .30;
    if(centre<=marks[0].y)return marks[0].a;
    var last=marks[marks.length-1];
    if(centre>=last.y)return last.a;
    for(var i=1;i<marks.length;i++){
      if(centre<=marks[i].y){
        var a=marks[i-1],b=marks[i],t=(centre-a.y)/(b.y-a.y||1);
        return a.a+(b.a-a.a)*t;
      }
    }
    return last.a;
  }

  /* Scroll -> 0..1 across the whole document. */
  function progress(){
    var max=root.scrollHeight-innerHeight;
    return max>0?clamp(scrollY/max):0;
  }

  function seek(t){
    if(!known||stillsOnly()||paused||held)return;
    t=Math.max(0,Math.min(t,duration-.05));
    /* A finger drag leaves far less CPU for decoding than a wheel does, so on a
       coarse pointer we take bigger steps through the film. */
    if(Math.abs(t-lastSeek)<(TOUCH.matches?.12:.02))return;
    lastSeek=t;
    if(video.readyState<1){pending=t;return;}
    try{video.currentTime=t}catch(e){}
  }

  function paint(){
    ticking=false;
    var p=progress();
    /* Reduced motion holds the first frame; pause holds whatever frame the film
       is on. Either way the page's own progress bar keeps keeping time. */
    if(!paused){
      var still=CALM.matches?0:Math.min(stills.length-1,Math.floor(p*stills.length));
      if(still!==lastStill){lastStill=still;stills.forEach(function(el,k){el.classList.toggle('is-on',k===still)})}
    }
    if(ring&&Math.abs(p-lastRing)>.004){
      lastRing=p;ring.style.strokeDashoffset=(RING*(1-p)).toFixed(2);
    }
    var w=washFor(scrollY+innerHeight*.5);
    if(Math.abs(w-lastWash)>.005){lastWash=w;root.style.setProperty('--film-wash',w.toFixed(3))}
    if(!CALM.matches)seek(p*duration);
  }
  function ask(){if(!ticking){ticking=true;requestAnimationFrame(paint)}}

  measure();
  root.style.setProperty('--film-wash',washFor(scrollY+innerHeight*.5).toFixed(3));
  addEventListener('scroll',ask,{passive:true});
  addEventListener('resize',function(){measure();ask()});
  /* late layout (fonts, images, the FAQ opening) moves the marks and the runway */
  addEventListener('load',function(){measure();ask()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){measure();ask()});

  video.addEventListener('loadedmetadata',function(){
    if(video.duration&&isFinite(video.duration))duration=video.duration;
    known=true;
    if(pending!==null){lastSeek=-1;seek(pending)}
    else{lastSeek=-1;seek(progress()*duration)}
  });
  /* If the file cannot be played (no codec, blocked host, offline), drop the video
     element and let the stills underneath carry the page. */
  video.addEventListener('error',function(){failed=true;layer.classList.add('no-video');setMode('failed')});
  if(video.error){failed=true;layer.classList.add('no-video');setMode('failed')}
  /* Safari drops the first seek until it has a frame to show: nudge it once. */
  video.addEventListener('loadeddata',function(){lastSeek=-1;seek(progress()*duration)});
  /* Only hide the pause button when nothing can move at all. On a phone the stills
     do move with the scroll, so pause there still means something. */
  root.classList.toggle('no-film-motion',CALM.matches);
  layer.classList.toggle('no-video',failed);
  if(TOUCH.addEventListener)TOUCH.addEventListener('change',function(){ask()});
  var calmWatch=(CALM.addEventListener||CALM.addListener);
  if(calmWatch)calmWatch.call(CALM,'change',function(){if(!failed)setMode(mode());ask()});

  /* Pause: freeze the background where it is. The dock shows what you will get. */
  if(toggle){
    toggle.addEventListener('click',function(){
      paused=!paused;
      toggle.setAttribute('aria-pressed',String(paused));
      toggle.setAttribute('aria-label',paused?'Play the background film':'Pause the background film');
      if(dock)dock.classList.toggle('is-paused',paused);
      if(!paused){lastSeek=-1;ask()}
    });
  }

  /* "Watch with sound" — the film once, properly, in the lightbox. */
  var opener=null;
  function openBox(from){
    if(!box||!full)return;
    held=true;
    opener=from||null;
    box.hidden=false;
    requestAnimationFrame(function(){box.classList.add('is-open')});
    document.body.classList.add('film-open');
    var close=box.querySelector('.film-box-close');
    if(close)close.focus();
    var pr=full.play();if(pr&&pr.catch)pr.catch(function(){});
  }
  function closeBox(){
    if(!box||box.hidden){return}
    box.classList.remove('is-open');
    if(full){full.pause();try{full.currentTime=0}catch(e){}}
    document.body.classList.remove('film-open');
    setTimeout(function(){if(!box.classList.contains('is-open'))box.hidden=true},260);
    held=false;lastSeek=-1;ask();
    var back=opener||soundBtn;
    if(back)back.focus();
    opener=null;
  }
  document.querySelectorAll('[data-film-sound]').forEach(function(el){
    el.addEventListener('click',function(){openBox(el)});
  });
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
  ask();
})();

var tSlides=document.querySelectorAll('#tCarousel .t-slide'),ti=0,tt,
    tPrev=document.getElementById('tPrev'),tNext=document.getElementById('tNext');
function tShow(x){ti=(x+tSlides.length)%tSlides.length;tSlides.forEach(function(s,k){s.classList.toggle('active',k===ti)});}
function tReset(){clearInterval(tt);tt=setInterval(function(){tShow(ti+1)},6500);}
if(tSlides.length&&tPrev&&tNext){
  tPrev.addEventListener('click',function(){tShow(ti-1);tReset();});
  tNext.addEventListener('click',function(){tShow(ti+1);tReset();});
  tReset();
}

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
function onScroll(){var h=document.documentElement.scrollHeight-innerHeight;if(sp)sp.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
  var fr=document.querySelector('.hero-visual');if(fr&&scrollY<900)fr.style.transform='translateY('+(scrollY*.06)+'px)';ticking=false;}
addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();
document.querySelectorAll('.role-grid,.f-grid,.price-grid,.stats-grid').forEach(function(g){
  Array.prototype.forEach.call(g.children,function(c,k){c.style.transitionDelay=(k*90)+'ms';if(c.classList.contains('reveal'))c.classList.add('zoom');});
});

var mq=document.getElementById('mqTrack');if(mq)mq.innerHTML+=mq.innerHTML;

// ---- Forms (progressive: posts JSON to PUBLIC_FORM_ENDPOINT, falls back to mailto) ----
document.querySelectorAll('form.lead-form').forEach(function(form){
  var status=form.querySelector('.form-status'),btn=form.querySelector('.form-submit'),
      lbl=btn&&btn.querySelector('.lbl'),orig=lbl?lbl.textContent:'';
  if(!lbl)return;
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
