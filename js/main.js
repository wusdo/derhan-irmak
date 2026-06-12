/* ============================================================
   DERHAN & IRMAK — main.js
   Preloader, custom cursor, scroll reveal, magnetic button,
   video lightbox (mp4 + YouTube/Vimeo embed), hero showreel.
   Tüm animasyonlar prefers-reduced-motion'a saygılıdır.
   ============================================================ */
(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- isim harflerini tek tek sahneye al ---- */
  document.querySelectorAll('.names .name').forEach(function(el){
    var text = el.getAttribute('data-text'), i;
    for(i=0;i<text.length;i++){
      var s=document.createElement('span');
      s.className='ch';s.textContent=text[i];
      s.style.setProperty('--d', i);
      el.appendChild(s);
    }
  });

  /* ---- film leader countdown ---- */
  var leader=document.getElementById('leader'),
      num=document.getElementById('leadNum'),
      sweep=document.getElementById('sweep');
  if(reduced){
    leader.classList.add('done');
    document.querySelectorAll('.ch,.amp,.tagline').forEach(function(el){
      el.style.animation='none';el.style.opacity='1';el.style.transform='none';
    });
  }else{
    var count=3, t0=performance.now(), per=480;
    (function tick(now){
      var elapsed=now-t0, c=3-Math.floor(elapsed/per);
      var frac=(elapsed%per)/per;
      sweep.style.background='conic-gradient(rgba(236,233,223,.16) '+(frac*360)+'deg, transparent 0deg)';
      if(c!==count && c>=1){count=c;num.textContent=c;}
      if(elapsed < per*3){requestAnimationFrame(tick);}
      else{leader.classList.add('done');setTimeout(function(){leader.remove()},800);}
    })(t0);
    setTimeout(function(){ if(document.getElementById('leader')) leader.classList.add('done'); }, 3000); // failsafe
  }

  /* ---- custom cursor ---- */
  if(window.matchMedia('(pointer:fine)').matches){
    var cur=document.getElementById('cursor'), cx=0, cy=0, x=0, y=0;
    document.addEventListener('mousemove',function(e){cx=e.clientX;cy=e.clientY});
    (function loop(){
      x+=(cx-x)*.22; y+=(cy-y)*.22;
      cur.style.transform='translate('+(x-cur.offsetWidth/2)+'px,'+(y-cur.offsetHeight/2)+'px)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('[data-cursor="play"]').forEach(function(el){
      el.addEventListener('mouseenter',function(){cur.classList.add('play')});
      el.addEventListener('mouseleave',function(){cur.classList.remove('play')});
    });
  }

  /* ---- magnetic button ---- */
  var mag=document.getElementById('magnet');
  if(mag && !reduced && window.matchMedia('(pointer:fine)').matches){
    mag.addEventListener('mousemove',function(e){
      var r=mag.getBoundingClientRect();
      var dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
      mag.style.transform='translate('+dx*.18+'px,'+dy*.3+'px)';
    });
    mag.addEventListener('mouseleave',function(){mag.style.transform=''});
  }

  /* ---- scroll reveal ---- */
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

  /* ============================================================
     HERO FONU (opsiyonel)
     1) assets/videos/showreel.mp4 varsa → düşük opaklıkta loop video
     2) yoksa → aşağıdaki backstage fotoğrafları cross-fade slayt
     Yeni backstage fotoğrafı eklediğinizde BTS listesine yolunu yazın.
     ============================================================ */
  var BTS=[
    /* hero'da backstage slaytı istersen fotoğraf yollarını buraya ekle:
       'assets/images/backstage/bts-1.jpg', ... */
  ];

  function heroBgWrap(){
    var hero=document.querySelector('.hero');
    if(!hero) return null;
    var w=hero.querySelector('.reel-bg');
    if(w) return w;
    w=document.createElement('div');
    w.className='reel-bg'; w.setAttribute('aria-hidden','true');
    hero.insertBefore(w, hero.firstChild);
    return w;
  }

  function startSlides(){
    if(!BTS.length) return;
    var wrap=heroBgWrap(); if(!wrap) return;
    BTS.forEach(function(src,i){
      var im=new Image(); im.src=src; im.alt='';
      im.onload=function(){
        wrap.appendChild(im);
        if(!wrap.querySelector('img.on')) im.classList.add('on'); // ilk yüklenen görünür
      };
      // yüklenemeyen dosya sessizce atlanır
    });
    if(reduced) return; // hareket azaltma: ilk kare sabit kalır
    setInterval(function(){
      var imgs=wrap.querySelectorAll('img');
      if(imgs.length<2) return;
      var cur=wrap.querySelector('img.on'), next;
      next=cur && cur.nextElementSibling ? cur.nextElementSibling : imgs[0];
      if(cur) cur.classList.remove('on');
      next.classList.add('on');
    },4500);
  }

  if(reduced){
    startSlides(); // video otomatik oynamaz; statik düşük opaklıkta kare
  }else{
    var reel=document.createElement('video');
    reel.muted=true; reel.loop=true; reel.playsInline=true;
    reel.setAttribute('playsinline','');
    reel.src='assets/videos/showreel.mp4';
    reel.addEventListener('canplay',function(){
      var wrap=heroBgWrap(); if(!wrap || wrap.querySelector('video')) return;
      wrap.appendChild(reel);
      reel.play().catch(function(){});
    });
    reel.addEventListener('error',function(){ reel.remove(); startSlides(); }); // showreel yok → fotoğraflar
    reel.load();
  }

  /* ---- kart içi önizleme videoları: hover'da oynat ---- */
  document.querySelectorAll('.work-card').forEach(function(card){
    var v=card.querySelector('video.fill');
    if(!v || reduced) return;
    card.addEventListener('mouseenter',function(){ v.play().catch(function(){}); });
    card.addEventListener('mouseleave',function(){ v.pause(); });
  });

  /* ============================================================
     VIDEO LIGHTBOX
     Kart üzerinde data-video="assets/videos/xxx.mp4"  → mp4 oynatıcı
     veya     data-embed="https://vimeo.com/123456789" → iframe embed
              (YouTube watch / youtu.be / Vimeo linkleri desteklenir)
     İkisi de yoksa tıklama bir şey yapmaz (gradyan yer tutucu kalır).
     ESC, backdrop tıklaması veya Close ile kapanır.
     ============================================================ */
  var lb=document.getElementById('lightbox'),
      lbFrame=lb.querySelector('.frame'),
      lbTitle=lb.querySelector('.lb-title'),
      lbClose=lb.querySelector('.lb-close'),
      lastFocus=null;

  function toEmbedUrl(url){
    var m, auto = reduced ? '' : 'autoplay=1';
    if((m=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)))
      return 'https://www.youtube.com/embed/'+m[1]+'?rel=0'+(auto?'&'+auto:'');
    if(/player\.vimeo\.com\/video\//.test(url)) // hazır player linki (h= hash'i korunur)
      return auto ? url+(url.indexOf('?')>-1?'&':'?')+auto : url;
    if((m=url.match(/vimeo\.com\/(\d+)(?:\/(\w+))?/)))
      return 'https://player.vimeo.com/video/'+m[1]+'?'+(m[2]?'h='+m[2]+'&':'')+auto;
    return url; // zaten embed URL'i ise olduğu gibi kullan
  }

  function openLightbox(card){
    var src=card.getAttribute('data-video'),
        embed=card.getAttribute('data-embed'),
        title=card.querySelector('h3');
    if(!src && !embed) return false;

    lbFrame.querySelectorAll('video,iframe').forEach(function(el){el.remove()});
    if(src){
      var v=document.createElement('video');
      v.src=src; v.controls=true; v.autoplay=!reduced; v.playsInline=true;
      lbFrame.appendChild(v);
    }else{
      var f=document.createElement('iframe');
      f.src=toEmbedUrl(embed);
      f.allow='autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen=true;
      lbFrame.appendChild(f);
    }
    lbTitle.textContent=title?title.textContent:'';
    lastFocus=document.activeElement;
    lb.classList.add('open');
    lb.removeAttribute('aria-hidden');
    document.body.style.overflow='hidden';
    lbClose.focus();
    return true;
  }

  function closeLightbox(){
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    // medyayı durdur ve kaldır (iframe sesi arkada kalmasın)
    setTimeout(function(){ lbFrame.querySelectorAll('video,iframe').forEach(function(el){el.remove()}); },350);
    if(lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('.work-card').forEach(function(card){
    card.addEventListener('click',function(e){
      if(openLightbox(card)) e.preventDefault();
      else e.preventDefault(); // video bağlanana dek href="#" zıplamasın
    });
  });
  lbClose.addEventListener('click',closeLightbox);
  lb.addEventListener('click',function(e){ if(e.target===lb) closeLightbox(); });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && lb.classList.contains('open')) closeLightbox();
  });
})();
