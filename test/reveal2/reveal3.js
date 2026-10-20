/* ================================================================ «Открытие карты» v3 (чат «Открытие карты 2», 14.10.2026)
   Одна реализация для приложения (make_v12.py вшивает после orb.js, заменяет rvRun) и для тестовой страницы
   app/design-variants/reveal/scene-v2/index.html. Один WebGL-прямоугольник и один шейдер; слои Gemini (app/assets/reveal/):
   фон, круг неба, фонарь выкл/вкл, туман (3 канала), вспышка + пыль; круг собирается по данным ядра — 10 планет на своих
   градусах (rvData.planets, rvData.asc); 8 медальонов систем — DOM-спрайты; персонаж — вырезка illustrations/name/cut/.
   Типографика — DOM по буквам. Весь кадр — функция времени RV3.render(t): по ней же пишется видео (rec.py) и держится
   синхрон со звуком. Правила: DPR ≤ 2, в шейдере нет циклов и шума — всё из текстур. */
var RV3=(function(){
  var W=432, PA=768/1376, SPEED=2, DUR=13.4/SPEED, PL=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'], SYS=['natal','bazi','matrix','hd','num','fengshui','jyotish','tzolkin'];
  var L=[.35,.45], WC=[.5,.33], WR=.32, LW=.27;   // огонёк, круг неба (центр, половина стороны), ширина фонаря — в uv фона 768×1376
  var SKYRECT=[WC[0]-WR, WC[1]-WR*PA, WR*2, WR*2*PA], LANTRECT=[L[0]-.49*LW, L[1]-.60*LW*PA, LW, LW*PA];
  var FS='precision highp float;varying vec2 vUv;uniform sampler2D uPlate,uChar,uSky,uLant,uFog,uFx;'
  +'uniform float uT,uLight,uSil,uRev,uFlash,uFogA,uLan,uZoom,uDust,uAmb,uS,uSc,uCardA,uWind,uBreath,uSkyA,uLantA,uLantOn,uSpark,uK;'
  +'uniform vec2 uPar,uC,uRes,uL,uM,uHalf;uniform vec4 uRect,uSkyRect,uLantRect;'
  +'float rbox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}'
  +'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'
  +'vec2 toPl(vec2 s){return vec2(s.x,.5+(s.y-.5)*uK);}'   // экран (uv сцены) → uv фона: фон во всю ширину, по высоте — по центру
  +'void main(){vec2 L=uL;vec2 drift=vec2(sin(uT*.21)*.004,cos(uT*.17)*.003);'
  +'vec2 uv=L+(toPl(uM+(vUv-uC)/uS)-L)/uZoom+drift;vec2 q=(uv-L)*vec2(PA,1.);float d=length(q);'.replace('PA',PA.toFixed(4))
  +'float sdf=rbox((vUv-uC)*uRes,uHalf*uS,18.);float outside=uCardA*step(0.,sdf);'
  +'float fl=.9+.1*sin(uT*9.)*sin(uT*5.3+1.)+.05*sin(uT*23.);'
  +'float n=texture2D(uFog,uv*vec2(1.3,2.2)+vec2(uT*.01,0.)).r;'
  +'float inPl=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);'
  +'vec3 plate=texture2D(uPlate,uv+uPar*.004).rgb;float light=smoothstep(uLight,uLight*.3,d+(n-.5)*.16);'
  +'vec3 col=plate*(light*(.82+.18*fl)+uAmb)*inPl;'
  +'{vec2 suv=(uv-uSkyRect.xy)/uSkyRect.zw;if(uSkyA>0.&&suv.x>0.&&suv.x<1.&&suv.y>0.&&suv.y<1.){vec4 sk=texture2D(uSky,suv+uPar*.003);col=mix(col,sk.rgb*(.75+.35*light+.3*uLan*exp(-d*2.5)),sk.a*uSkyA);}}'
  +'col+=vec3(1.,.42,.18)*uLan*fl*(.34*exp(-d*13.)+.10*exp(-d*3.6));'
  +'col+=vec3(1.,.78,.5)*uSpark*(fl*.9*exp(-d*d*9000.)+.5*exp(-d*60.)+.12*exp(-d*9.));'
  +'{vec2 luv=(uv-uLantRect.xy)/uLantRect.zw;if(uLantA>0.&&luv.x>0.&&luv.x<1.&&luv.y>0.&&luv.y<1.){luv.x+=.004*sin(uT*1.3)*luv.y;vec4 lo=texture2D(uLant,vec2(luv.x,luv.y*.5));vec4 ln=texture2D(uLant,vec2(luv.x,.5+luv.y*.5));vec4 lt=mix(lo,ln,uLantOn);vec3 lc=lt.rgb*(.35+.65*light+uAmb+.5*uLantOn);col=mix(col,lc,lt.a*uLantA);}}'
  +'col=mix(col,vec3(.016,.009,.035)+vec3(.85,.72,.4)*.22*exp(-max(sdf,0.)/38.),outside);'
  +'float ring=uCardA*(smoothstep(1.6,.4,abs(sdf))*.9+smoothstep(1.2,.3,abs(sdf+6.))*.45);col=mix(col,vec3(.85,.72,.40),ring);'
  +'{vec2 sp=(uv-vec2(uRect.x+uRect.z*.5,uRect.y+uRect.w*.985))/vec2(uRect.z*.62,uRect.w*.035);col*=1.-.6*uSil*exp(-dot(sp,sp)*1.6)*(1.-outside);}'
  // персонаж: ноги — в стороне экрана; картинка масштабируется uSc отдельно от сцены uS
  +'vec2 feet=vec2(uRect.x+uRect.z*.5,uRect.y+uRect.w);vec2 feetS=vec2(feet.x,.5+(feet.y-.5)/uK);'
  +'vec2 feetScr=uC+(feetS-uM)*uS,dC=feetScr-(uC+(feetS-uM)*uSc);'
  +'vec2 uvC=L+(toPl(uM+(vUv-dC-uC)/uSc)-L)/uZoom+drift;vec2 cuv=(uvC-uRect.xy)/uRect.zw+uPar*.010;'
  +'cuv.y=1.-(1.-cuv.y)*(1.+uBreath*.012*sin(uT*1.5));float wmask=smoothstep(.38,.92,cuv.y)*smoothstep(1.,.93,cuv.y);'
  +'cuv.x+=uWind*wmask*(.010*sin(cuv.y*9.-uT*2.1)+.006*sin(cuv.y*17.+uT*3.3)+.004*sin(uT*.7));'
  +'if(uSil>0.&&cuv.x>0.&&cuv.x<1.&&cuv.y>0.&&cuv.y<1.){vec4 c=texture2D(uChar,cuv);'
  +'vec2 dir=normalize((L-uv)*vec2(PA,1.))/uRect.zw*vec2(1./PA,1.);'.replace(/PA/g,PA.toFixed(4))
  +'float rim=clamp(c.a-texture2D(uChar,cuv+dir*.011).a,0.,1.);float rim2=clamp(c.a-texture2D(uChar,cuv+dir*.03).a,0.,1.);'
  +'float rev=uRev<.01?0.:smoothstep(uRev,uRev*.5,d+(n-.5)*.26);'
  +'vec3 lit=c.rgb*vec3(1.,.93,.84)*(.50+.62*exp(-d*2.4))*mix(1.,.62,smoothstep(.55,1.,cuv.y));vec3 sil=c.rgb*.05*vec3(.8,.7,1.)+vec3(.020,.012,.032);'
  +'vec3 cc=mix(sil,lit,rev);cc+=(rim*1.1+rim2*.45)*vec3(1.,.66,.34)*max(uLan,.7)*fl*mix(1.,.2,rev)*exp(-d*1.1);'
  +'float edge=smoothstep(uRev*.5,uRev*.78,d+(n-.5)*.26)*smoothstep(uRev*1.05,uRev*.8,d+(n-.5)*.26);cc+=vec3(1.,.8,.45)*edge*.5*step(.02,uRev)*step(uRev,2.4);'
  +'col=mix(col,cc,c.a*uSil*smoothstep(1.,.9,cuv.y));}'
  +'float band=smoothstep(.50,.98,uv.y);float fy=(uv.y-.45)/.6;'
  +'float fa=texture2D(uFog,vec2(uv.x*.75-uT*.016,fy*.8+.1)).r;float fb=texture2D(uFog,vec2(uv.x*.6+uT*.011+.3,fy*.9)).g;float fc=texture2D(uFog,vec2(uv.x*.5-uT*.008+.6,fy*.7+.25)).b;'
  +'float fog=clamp(fa*.45+fb*.55+fc*.75*smoothstep(.6,1.,uv.y),0.,1.)*band;'
  +'vec3 fogc=vec3(.40,.34,.50)*(.10+.75*light+uAmb)+vec3(1.,.5,.25)*.22*exp(-d*3.2)*uLan;col=mix(col,fogc,fog*uFogA*.8*(1.-outside));'
  +'if(uDust>0.){float du=texture2D(uFx,uv*vec2(1.2,2.1)+vec2(uT*.012,-uT*.02)).g+texture2D(uFx,uv*vec2(2.0,3.5)+vec2(-uT*.008,-uT*.035)).g*.7;col+=vec3(1.,.8,.45)*du*uDust*(.55+.45*sin(uT*4.+uv.x*30.))*(1.-outside)*exp(-d*1.2);}'
  +'if(uFlash>0.){vec2 buv=q/(.55+.9*uFlash)+.5;float br=texture2D(uFx,buv).r*step(0.,buv.x)*step(buv.x,1.)*step(0.,buv.y)*step(buv.y,1.);col+=vec3(1.,.80,.52)*uFlash*(br*1.3+exp(-d*(5.-3.4*uFlash))*1.1);col=mix(col,vec3(1.,.93,.80),uFlash*uFlash*.20*exp(-d*.9));}'
  +'col*=1.-.30*smoothstep(.45,1.1,length((vUv-.5)*vec2(.9,1.1)));col+=(h(vUv*800.+uT)-.5)*.018;gl_FragColor=vec4(col,1.);}';
  var cl=function(x,a,b){ a=a||0; b=b==null?1:b; return Math.max(a,Math.min(b,x)); }, seg=function(t,a,b){ return cl((t-a)/(b-a)); };
  var eo=function(x){ return 1-Math.pow(1-x,3); }, eo5=function(x){ return 1-Math.pow(1-x,5); }, ei=function(x){ return x*x*x; }, eio=function(x){ return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2; };
  var back=function(x){ var c=1.70158; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  /* opt: {root, base (папка слоёв), charSrc, charSize [w,h], sealSrc, X:{name,sub,act,birth,city,planets:[[key,lon,w]],asc}, txt:{sky,eight,kick,btn,skip},
          reduced, onDone(), onSkipAll(), audioSrc, rec} */
  function run(opt){
    var X=opt.X, root=opt.root, txt=opt.txt, H=opt.H||768;
    var plH=Math.round(W/PA), plTop=Math.round((H-plH)/2);   // фон во всю ширину сцены, подписи — в его координатах
    root.innerHTML='<div class="rv3cw"><canvas></canvas></div><div class="rv3sys"></div><div class="rv3edge"></div><div class="rv3pl" style="top:'+plTop+'px;height:'+plH+'px">'
      +'<div class="rv3cap rv3date"></div><div class="rv3cap rv3k1"></div><div class="rv3cap rv3d1"></div><div class="rv3cap rv3c1"></div><div class="rv3cap rv3c2"></div>'
      +'<div class="rv3seal"></div><div class="rv3cap rv3kick"></div><div class="rv3cap rv3nm"></div><div class="rv3cap rv3sub"></div><div class="rv3cap rv3act"></div>'
      +'<div class="rvface" hidden><img alt=""></div>'
      +'<button class="rvbtn rv3btn" type="button"></button><div class="rvwrap"></div></div><button class="rvskip rv3skip" type="button"></button>';
    var $=function(c){ return root.querySelector('.'+c); };
    $('rv3btn').textContent=txt.btn; $('rv3skip').textContent=txt.skip; $('rv3act').textContent=X.act||''; $('rv3seal').style.backgroundImage='url('+opt.sealSrc+')';
    root.querySelector('.rvface img').src=opt.charSrc;
    function split(c,s){ var el=$(c); el.textContent=''; return Array.from(String(s||'')).map(function(ch){ var sp=document.createElement('span'); sp.className='ch'; sp.textContent=ch; el.appendChild(sp); return sp; }); }
    var T={ date:split('rv3date',(X.birth||'').split(' · ')[0]), k1:split('rv3k1',txt.sky.toUpperCase()), d1:split('rv3d1',X.birth||''), c1:split('rv3c1',(X.city||'').toUpperCase()),
            c2:split('rv3c2',txt.eight), kick:split('rv3kick',txt.kick), nm:split('rv3nm',X.name||''), sub:split('rv3sub',X.sub||'') };
    function letters(arr,t,a,b,o){ o=o||{}; var st=o.st==null?.028:o.st, din=o.din==null?.5:o.din, dout=o.dout==null?.35:o.dout, n=arr.length, mid=(n-1)/2;
      arr.forEach(function(s,i){ var k=o.center?Math.abs(i-mid):i, pin=eo5(seg(t,a+k*st,a+k*st+din)), pout=b==null?0:ei(seg(t,b+k*st*.5,b+k*st*.5+dout));
        s.style.opacity=pin*(1-pout); s.style.transform='translateY('+((1-pin)*(o.dy==null?14:o.dy)-pout*10)+'px) scale('+(.92+.08*pin)+')'; s.style.filter=pin<1||pout>0?'blur('+((1-pin)*6+pout*5)+'px)':'none'; }); }
    // медальоны систем — DOM-спрайты
    var sysBox=$('rv3sys'), SYSEL=SYS.map(function(n){ var im=new Image(); im.src=opt.base+'sys_'+n+'.webp'; im.alt=''; sysBox.appendChild(im); return im; });
    var K=(H/W)*PA, zoomNow=1, sNow=1, cNow=[.5,(plTop+plH*.5-112)/H], mNow=cNow.slice();
    function uvToScr(u,t){ var dr=[Math.sin(t*.21)*.004, Math.cos(t*.17)*.003]; var p=[(u[0]-dr[0]-L[0])*zoomNow+L[0], (u[1]-dr[1]-L[1])*zoomNow+L[1]]; var s=[p[0], .5+(p[1]-.5)/K];
      return [(cNow[0]+(s[0]-mNow[0])*sNow)*W, (cNow[1]+(s[1]-mNow[1])*sNow)*H]; }
    // круг неба: слой + планеты на градусах; АСЦ слева, знаки против часовой; планеты летят от огонька на свои градусы
    var SKC=document.createElement('canvas'); SKC.width=SKC.height=1024; var skx=SKC.getContext('2d'), IMG={};
    function img(k,src){ return new Promise(function(r){ var i=new Image(); i.onload=function(){ IMG[k]=i; r(); }; i.onerror=function(){ r(); }; i.src=src; }); }
    var asc=X.asc||0, SKP=(X.planets||[]).map(function(p){ var a=Math.PI-(p[1]-asc)*Math.PI/180; return {k:p[0],w:p[2]||1,a:a,ord:((Math.PI/2-a)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)}; }).sort(function(x,y){ return x.ord-y.ord; });
    function drawSky(prog,fly,glow){ var c=skx, cx=512, cy=512, R=512*.78, A0=-Math.PI/2; c.clearRect(0,0,1024,1024); if(!IMG.wheel) return;
      c.save(); c.beginPath(); c.moveTo(cx,cy); c.arc(cx,cy,560,A0-Math.PI*prog,A0+Math.PI*prog); c.closePath(); c.clip(); c.globalAlpha=.95; c.drawImage(IMG.wheel,0,0,1024,1024); c.restore(); c.globalAlpha=1;
      var sx=(L[0]-SKYRECT[0])/SKYRECT[2]*1024, sy=(L[1]-SKYRECT[1])/SKYRECT[3]*1024;
      SKP.forEach(function(p,i){ var k=eo(cl(fly-i*.55)); if(k<=0) return; var tx=cx+R*Math.cos(p.a), ty=cy+R*Math.sin(p.a);
        var x=sx+(tx-sx)*k, y=sy+(ty-sy)*k-Math.sin(k*Math.PI)*60, s=38*p.w*(.6+.4*k), pop=1+.5*Math.sin(cl((fly-i*.55-1)*3)*Math.PI);
        var g=c.createRadialGradient(x,y,0,x,y,s*1.6*pop); g.addColorStop(0,'rgba(255,224,160,'+(.5*glow*k)+')'); g.addColorStop(1,'rgba(255,180,90,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,s*1.6*pop,0,6.283); c.fill();
        var pi=PL.indexOf(p.k); if(IMG.planets&&pi>=0){ c.globalAlpha=cl(k*2); c.drawImage(IMG.planets,pi*96,0,96,96,x-s/2*pop,y-s/2*pop,s*pop,s*pop); c.globalAlpha=1; } }); }
    // WebGL
    var cv=root.querySelector('canvas'), gl=cv.getContext('webgl',{antialias:false,alpha:false,preserveDrawingBuffer:!!opt.rec});
    if(!gl){ root.classList.add('rv3nogl'); return null; }
    var DPR=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    function sh(type,src){ var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 vUv;void main(){vUv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    var lp=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
    var U={}; ['uPlate','uChar','uSky','uLant','uFog','uFx','uT','uLight','uSil','uRev','uFlash','uFogA','uLan','uZoom','uDust','uAmb','uS','uSc','uCardA','uWind','uBreath','uSkyA','uLantA','uLantOn','uSpark','uK','uPar','uC','uRes','uL','uM','uHalf','uRect','uSkyRect','uLantRect'].forEach(function(n){ U[n]=gl.getUniformLocation(pr,n); });
    function texParams(wrap){ [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(function(k){ gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR); }); [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(function(k){ gl.texParameteri(gl.TEXTURE_2D,k,wrap?gl.REPEAT:gl.CLAMP_TO_EDGE); }); }
    function tex(unit,src,wrap){ return new Promise(function(res){ var im=new Image(); im.onload=function(){ var t=gl.createTexture(); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,t); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im); texParams(wrap); res(); }; im.onerror=function(){ res(); }; im.src=src; }); }
    var skyT=gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,skyT); texParams(false); var skyKey='';
    function skyTex(prog,fly,glow){ var key=prog.toFixed(3)+'|'+fly.toFixed(2)+'|'+glow.toFixed(2); if(key===skyKey) return; skyKey=key; drawSky(prog,fly,glow); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,skyT); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,SKC); }
    var RECT, par=[0,0], parT=[0,0];
    function setSize(sz){ sz=sz||[600,900]; var ch=.46, cw=ch*(sz[0]/sz[1])/PA; RECT=[.62-cw/2, .77-ch, cw, ch]; }
    setSize(opt.charSize);
    var fw=W*.52, fh=plH*.52, fx=(W-fw)/2, fy=(plH/2-112)-fh/2;
    function render(tr){
      var t=tr*SPEED;   // сценическое время: все метки ниже — в секундах исходной 13,4-секундной сцены
      var dz=seg(t,.15,.85); T.date.forEach(function(s,i){ var k=i-(T.date.length-1)/2; s.style.opacity=1-ei(dz); s.style.transform='translateX('+(-k*19*eio(dz))+'px) scale('+(1-.5*dz)+')'; s.style.filter='blur('+(dz*5)+'px)'; });
      var spark=eo(seg(t,.8,1.3))*(1+.6*seg(t,4.7,5.4))*(1-seg(t,5.6,6.2));
      var lan=.15*seg(t,1.2,2)+.35*eio(seg(t,4.7,5.4))-.35*seg(t,5.3,6.1)+.85*eo(seg(t,6.3,6.5))+.15*seg(t,6.5,7.5);
      var light=.02+.14*eo(seg(t,.9,2.2))+1.4*eio(seg(t,2.2,4.6))-.9*eio(seg(t,5.2,6.3))+1.4*eo(seg(t,6.4,7.4));
      var sil=eio(seg(t,5.1,6.0)), rev=t<6.45?0:.05+2.6*eo(seg(t,6.5,8.6));
      var flash=t<6.4?0:t<6.52?seg(t,6.4,6.52):1-eo(seg(t,6.52,7.5));
      var zoom=1+.035*seg(t,1,5.2)+.07*eio(seg(t,5.2,6.4))-.04*eo(seg(t,6.4,7.3))+.025*seg(t,7.3,9.4);
      par=[par[0]+(parT[0]-par[0])*.08, par[1]+(parT[1]-par[1])*.08];
      var k=eio(seg(t,9.4,10.5)), S=1-.48*k, SC=1-.42*k;
      zoomNow=zoom; sNow=S; mNow=[cNow[0]+(.5-cNow[0])*k, cNow[1]+(.5-cNow[1])*k];
      skyTex(eio(seg(t,2.2,3.9)),(t-2.9)/.42,.6+.4*Math.sin(t*2.));
      gl.viewport(0,0,cv.width,cv.height);
      gl.uniform1i(U.uPlate,0); gl.uniform1i(U.uChar,1); gl.uniform1i(U.uSky,2); gl.uniform1i(U.uLant,3); gl.uniform1i(U.uFog,4); gl.uniform1i(U.uFx,5);
      gl.uniform1f(U.uT,t); gl.uniform1f(U.uK,K); gl.uniform2f(U.uL,L[0],L[1]);
      gl.uniform1f(U.uLight,light); gl.uniform1f(U.uSil,sil); gl.uniform1f(U.uRev,rev); gl.uniform1f(U.uFlash,flash);
      gl.uniform1f(U.uFogA,eo(seg(t,.9,2.4))); gl.uniform1f(U.uLan,lan); gl.uniform1f(U.uSpark,spark); gl.uniform1f(U.uZoom,zoom); gl.uniform1f(U.uDust,seg(t,6.6,7.4)*(1-.6*seg(t,10,12)));
      gl.uniform1f(U.uAmb,.05*seg(t,7,9)); gl.uniform2f(U.uPar,par[0],par[1]); gl.uniform4f(U.uRect,RECT[0],RECT[1],RECT[2],RECT[3]);
      gl.uniform4f(U.uSkyRect,SKYRECT[0],SKYRECT[1],SKYRECT[2],SKYRECT[3]); gl.uniform1f(U.uSkyA,seg(t,2.2,2.5));
      gl.uniform4f(U.uLantRect,LANTRECT[0],LANTRECT[1],LANTRECT[2],LANTRECT[3]); gl.uniform1f(U.uLantA,eo(seg(t,5.4,6.1))); gl.uniform1f(U.uLantOn,eo(seg(t,6.25,6.45)));
      gl.uniform1f(U.uS,S); gl.uniform1f(U.uSc,SC); gl.uniform1f(U.uCardA,eo(seg(t,9.7,10.5)));
      gl.uniform2f(U.uC,cNow[0],cNow[1]); gl.uniform2f(U.uM,mNow[0],mNow[1]); gl.uniform2f(U.uRes,W,H); gl.uniform2f(U.uHalf,W*.5,plH*.5); gl.uniform1f(U.uWind,eo(seg(t,6.9,8.4))); gl.uniform1f(U.uBreath,sil);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      SYSEL.forEach(function(im,i){ var a=-Math.PI/2+i*Math.PI/4, ring=[WC[0]+.47*Math.cos(a), WC[1]+.47*PA*Math.sin(a)];
        var pin=eo(seg(t,4.0+i*.09,4.45+i*.09)), pgo=ei(seg(t,4.75+i*.06,5.35+i*.03));
        var u=[ring[0]+(L[0]-ring[0])*pgo, ring[1]+(L[1]-ring[1])*pgo], p=uvToScr(u,t), sc=(.4+.6*pin)*(1-pgo*.9);
        im.style.opacity=pin*(1-ei(cl(pgo*1.15))); im.style.transform='translate('+p[0].toFixed(1)+'px,'+p[1].toFixed(1)+'px) scale('+sc.toFixed(3)+') rotate('+((1-pin)*-40+pgo*90).toFixed(1)+'deg)'; });
      letters(T.k1,t,2.7,4.05,{st:.016}); letters(T.d1,t,2.95,4.12,{st:.03,center:true}); letters(T.c1,t,3.25,4.2,{st:.05,center:true}); letters(T.c2,t,4.35,5.15,{st:.022,din:.45});
      $('rv3edge').style.opacity=1-k;
      var sp=seg(t,10.6,10.95), se=$('rv3seal'); se.style.left=(fx+fw-52)+'px'; se.style.top=(fy+fh-48)+'px'; se.style.opacity=cl(sp*5); se.style.transform='scale('+(2.4-1.4*back(sp))+') rotate('+((1-eo(sp))*-18)+'deg)';
      letters(T.kick,t,10.75,null,{st:.02,center:true,dy:6});
      letters(T.nm,t,10.95,null,{st:.055,din:.7,dy:22}); var sw=seg(t,11.0,12.6); T.nm.forEach(function(s,i){ s.style.backgroundPosition=(100-sw*100-i*4)+'% 0'; });
      letters(T.sub,t,11.6,null,{st:.012,dy:8});
      var a=eo(seg(t,11.9,12.5)), ae=$('rv3act'); ae.style.opacity=a; ae.style.transform='translateY('+((1-a)*10)+'px)';
      var b=eo(seg(t,12.3,12.9)), be=$('rv3btn'); be.style.opacity=b; be.style.transform='translateY('+((1-b)*14)+'px)'; be.style.pointerEvents=b>.9?'auto':'none';
      $('rv3skip').style.opacity=seg(t,.1,.5)*(1-seg(t,10.4,10.8));
      if(tr>=DUR&&!api.done){ api.done=true; root.classList.add('done'); }
    }
    var api={render:render,setSize:setSize,DUR:DUR,done:false,t0:0,run:false,au:null};
    api.ready=Promise.all([tex(0,opt.base+'plate.jpg'),tex(1,opt.charSrc),tex(3,opt.base+'lantern.webp'),tex(4,opt.base+'fog.jpg',true),tex(5,opt.base+'fx.jpg',true),img('wheel',opt.base+'wheel.webp'),img('planets',opt.base+'planets.webp'),document.fonts?document.fonts.ready:Promise.resolve()]);
    function loop(){ if(!api.run||!root.isConnected) return; var t=(performance.now()-api.t0)/1000; if(api.au&&!api.au.paused&&api.au.currentTime>.2&&Math.abs(api.au.currentTime/SPEED-t)>.12) t=api.au.currentTime/SPEED; /* часы — performance; звук ведёт, если реально играет и разошёлся */ render(Math.min(t,DUR)); if(t<DUR+.5) requestAnimationFrame(loop); else api.run=false; }
    api.start=function(from){ api.t0=performance.now()-from*1000; if(api.au){ try{ api.au.currentTime=from; api.au.play().catch(function(){}); }catch(e){} } if(navigator.vibrate&&!from) setTimeout(function(){ try{ navigator.vibrate(40); }catch(e){} },6400); api.run=true; loop(); };
    api.skip=function(){ if(api.au){ try{ api.au.pause(); }catch(e){} api.au=null; } api.t0=performance.now()-DUR*1000; if(!api.run){ api.run=true; loop(); } };
    api.stop=function(){ api.run=false; if(api.au){ try{ api.au.pause(); }catch(e){} } };
    if(opt.audioSrc){ try{ api.au=new Audio(opt.audioSrc); api.au.preload='auto'; api.au.playbackRate=SPEED; api.au.preservesPitch=false; }catch(e){ api.au=null; } }
    $('rv3skip').addEventListener('click',api.skip);
    if(!opt.rec){ window.addEventListener('deviceorientation',function(e){ parT=[cl((e.gamma||0)/25,-1,1), cl(((e.beta||45)-45)/25,-1,1)]; }); }
    return api;
  }
  return {run:run,W:W,PA:PA,DUR:DUR};
})();
