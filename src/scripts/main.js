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

/* reviews carousel: only present once real reviews are added */
var tSlides=document.querySelectorAll('#tCarousel .t-slide'),ti=0,tt;
if(tSlides.length>1&&document.getElementById('tPrev')){
function tShow(x){ti=(x+tSlides.length)%tSlides.length;tSlides.forEach(function(s,k){s.classList.toggle('active',k===ti)});}
function tReset(){clearInterval(tt);tt=setInterval(function(){tShow(ti+1)},6500);}
document.getElementById('tPrev').addEventListener('click',function(){tShow(ti-1);tReset();});
document.getElementById('tNext').addEventListener('click',function(){tShow(ti+1);tReset();});
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
function onScroll(){var h=document.documentElement.scrollHeight-innerHeight;sp.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
  var fr=document.querySelector('.hero-visual');if(fr&&scrollY<900)fr.style.transform='translateY('+(scrollY*.06)+'px)';ticking=false;}
addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();
document.querySelectorAll('.role-grid,.f-grid,.price-grid,.stats-grid').forEach(function(g){
  Array.prototype.forEach.call(g.children,function(c,k){c.style.transitionDelay=(k*90)+'ms';if(c.classList.contains('reveal'))c.classList.add('zoom');});
});

var mq=document.getElementById('mqTrack');mq.innerHTML+=mq.innerHTML;

// ---- Forms (progressive: posts JSON to PUBLIC_FORM_ENDPOINT, falls back to mailto) ----
document.querySelectorAll('form.lead-form').forEach(function(form){
  var started=Date.now();
  var status=form.querySelector('.form-status'),btn=form.querySelector('.form-submit'),lbl=btn.querySelector('.lbl'),orig=lbl.textContent;
  function setErr(name,msg){var el=form.querySelector('[data-err-for="'+name+'"]'),inp=form.elements[name];if(el)el.textContent=msg||'';if(inp&&inp.classList)inp.classList.toggle('invalid',!!msg);if(inp&&inp.setAttribute)inp.setAttribute('aria-invalid',msg?'true':'false');}
  function validate(){
    var ok=true,f=form.elements;
    form.querySelectorAll('[data-err-for]').forEach(function(e){setErr(e.getAttribute('data-err-for'),'')});
    if(f.name&&f.name.value.trim().length<2){setErr('name','Please enter your name.');ok=false}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())){setErr('email','Please enter a valid email address.');ok=false}
    if(f.phone&&f.phone.value&&!/^[0-9+\-\s()]{7,18}$/.test(f.phone.value.trim())){setErr('phone','Enter a valid phone number.');ok=false}
    if(f.institution&&!f.institution.value.trim()){setErr('institution','Please enter your institution.');ok=false}
    if(f.message&&f.message.required&&f.message.value.trim().length<10){setErr('message','Please write a few words (at least 10 characters).');ok=false}
    if(f.consent&&!f.consent.checked){setErr('consent','Please accept to continue.');ok=false}
    if(!ok){var bad=form.querySelector('.invalid, [data-err-for]:not(:empty)');var fi=form.querySelector('.invalid');if(fi)fi.focus();}
    return ok;
  }
  function say(msg,ok){status.textContent=msg;status.className='form-status '+(ok?'ok':'fail')}
  form.addEventListener('submit',function(e){
    e.preventDefault();status.textContent='';
    if(form.elements.website&&form.elements.website.value)return; // honeypot
    if(Date.now()-started<3000)return;                              // bots submit instantly
    if(!validate())return;
    /* one submission per form per minute from this browser; the form provider
       (e.g. Formspree) does the real server-side rate limiting and validation */
    var tkey='sarasvi-sent-'+form.getAttribute('data-form'),last=0;
    try{last=+localStorage.getItem(tkey)||0}catch(err){}
    if(Date.now()-last<60000){say('You just sent this form. Please wait a minute before sending it again.',false);return;}
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
      .then(function(r){if(!r.ok)throw new Error(r.status);try{localStorage.setItem(tkey,String(Date.now()))}catch(err){}form.reset();
        if(data.form==='newsletter'){say('Thanks for subscribing!',true);if(window.gtag)window.gtag('event','sign_up',{method:'newsletter'});return;}
        if(data.form==='feedback'){say('Thank you! We have received your feedback.',true);if(window.gtag)window.gtag('event','feedback_sent');return;}
        location.href='/thank-you/?form='+encodeURIComponent(data.form);})
      .catch(function(){say('Something went wrong. Please try again or email us directly.',false)})
      .finally(function(){btn.classList.remove('loading');lbl.textContent=orig});
  });
});
})();
