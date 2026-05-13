export function getFaceHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>Face Filter AR</title>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js" crossorigin="anonymous"><\/script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1632090166/camera_utils.js" crossorigin="anonymous"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#000;overflow:hidden;font-family:monospace;}
  #video{display:none;}
  #canvas{position:fixed;top:0;left:50%;transform:translateX(-50%) scaleX(-1);
    height:100vh;width:auto;max-width:100vw;z-index:1;}

  /* Filter strip at bottom */
  #filters{position:fixed;bottom:150px;left:0;right:0;
    display:flex;flex-direction:column;align-items:center;gap:10px;z-index:200;}
  #filter-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:0 10px;}
  .fb{width:52px;height:52px;border-radius:14px;
    border:2px solid rgba(255,255,255,.12);background:rgba(0,0,0,.6);
    font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:all .2s;-webkit-tap-highlight-color:transparent;flex-direction:column;gap:1px;}
  .fb span{font-size:8px;letter-spacing:.5px;color:rgba(255,255,255,.4);}
  .fb.active{border-color:#b441ff;box-shadow:0 0 14px rgba(180,65,255,.5);
    background:rgba(180,65,255,.2);transform:scale(1.1);}
  .fb.active span{color:#b441ff;}

  #status{position:fixed;bottom:130px;left:50%;transform:translateX(-50%);
    font-size:10px;letter-spacing:2px;text-transform:uppercase;
    color:rgba(180,65,255,.8);background:rgba(0,0,0,.6);padding:6px 14px;
    border-radius:20px;border:1px solid rgba(180,65,255,.15);z-index:200;
    white-space:nowrap;animation:blink 2s ease-in-out infinite;}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}

  #loading{position:fixed;inset:0;background:#06060f;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:18px;z-index:9999;}
  .spinner{width:44px;height:44px;border:3px solid rgba(180,65,255,.2);
    border-top-color:#b441ff;border-radius:50%;animation:spin .8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  #load-text{font-size:12px;letter-spacing:3px;color:rgba(180,65,255,.7);text-transform:uppercase;}
</style>
</head>
<body>

<div id="loading">
  <div class="spinner"></div>
  <div id="load-text">Loading face model…</div>
</div>

<video id="video" playsinline></video>
<canvas id="canvas"></canvas>

<div id="filters">
  <div id="filter-row">
    <button class="fb active" data-f="cat"    onclick="setFilter(this)">🐱<span>CAT</span></button>
    <button class="fb"        data-f="dog"    onclick="setFilter(this)">🐶<span>DOG</span></button>
    <button class="fb"        data-f="wizard" onclick="setFilter(this)">🧙<span>WIZARD</span></button>
    <button class="fb"        data-f="party"  onclick="setFilter(this)">🎉<span>PARTY</span></button>
    <button class="fb"        data-f="robot"  onclick="setFilter(this)">🤖<span>ROBOT</span></button>
    <button class="fb"        data-f="fire"   onclick="setFilter(this)">🔥<span>FIRE</span></button>
    <button class="fb"        data-f="angel"  onclick="setFilter(this)">😇<span>ANGEL</span></button>
    <button class="fb"        data-f="all"    onclick="setFilter(this)">✨<span>ALL</span></button>
  </div>
</div>
<div id="status">● Detecting face…</div>

<script>
  const videoEl  = document.getElementById('video');
  const canvasEl = document.getElementById('canvas');
  const ctx      = canvasEl.getContext('2d');
  const loading  = document.getElementById('loading');
  const loadTxt  = document.getElementById('load-text');
  const statusEl = document.getElementById('status');
  let activeFilter = 'cat';
  let faceFound = false;
  let frame = 0;
  let particles = [];

  function setFilter(btn) {
    document.querySelector('.fb.active').classList.remove('active');
    btn.classList.add('active');
    activeFilter = btn.dataset.f;
    particles = [];
  }

  // ── MediaPipe ──────────────────────────────────────────────────────────
  const faceMesh = new FaceMesh({
    locateFile: f => 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/' + f
  });
  faceMesh.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:.5, minTrackingConfidence:.5 });
  faceMesh.onResults(onResults);

  loadTxt.textContent = 'Starting camera…';
  const camera = new Camera(videoEl, {
    onFrame: async () => {
      canvasEl.width  = videoEl.videoWidth  || 640;
      canvasEl.height = videoEl.videoHeight || 480;
      await faceMesh.send({ image: videoEl });
    },
    width:1280, height:720
  });
  camera.start()
    .then(() => loading.style.display = 'none')
    .catch(e => { loadTxt.textContent = 'Camera error: ' + e.message; });

  // ── Render ─────────────────────────────────────────────────────────────
  function onResults(results) {
    const W = canvasEl.width, H = canvasEl.height;
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(results.image, 0, 0, W, H);
    frame++;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      if (!faceFound) {
        faceFound = true;
        statusEl.textContent = '✓ Face locked!';
        statusEl.style.color = '#b441ff';
        statusEl.style.animation = 'none';
      }
      for (const lms of results.multiFaceLandmarks) {
        const p = i => ({ x: lms[i].x * W, y: lms[i].y * H });
        if (activeFilter==='cat'    || activeFilter==='all') drawCatFilter(p,W,H);
        if (activeFilter==='dog'    || activeFilter==='all') drawDogFilter(p,W,H);
        if (activeFilter==='wizard' || activeFilter==='all') drawWizardHat(p,W,H);
        if (activeFilter==='party'  || activeFilter==='all') drawPartyHat(p,W,H);
        if (activeFilter==='robot'  || activeFilter==='all') drawRobotMask(p,W,H);
        if (activeFilter==='fire'   || activeFilter==='all') drawFireEffect(p,W,H);
        if (activeFilter==='angel'  || activeFilter==='all') drawAngelHalo(p,W,H);
        if (activeFilter==='all')                             drawSparkleTrail(p,W,H);
      }
    } else {
      if (faceFound) {
        faceFound = false;
        statusEl.textContent = '● Detecting face…';
        statusEl.style.color = 'rgba(180,65,255,.8)';
        statusEl.style.animation = 'blink 2s ease-in-out infinite';
      }
    }
    drawParticles(W,H);
  }

  // ── Helper ─────────────────────────────────────────────────────────────
  function faceWidth(p)  { return Math.abs(p(454).x - p(234).x); }
  function faceHeight(p) { return Math.abs(p(10).y  - p(152).y); }
  function faceCx(p)     { return (p(234).x + p(454).x) / 2; }

  // ── 1. CAT FILTER ──────────────────────────────────────────────────────
  function drawCatFilter(p,W,H) {
    const fw = faceWidth(p), cx = faceCx(p);
    const topY = p(10).y;

    ctx.save();
    // Left ear (triangle)
    ctx.beginPath();
    ctx.moveTo(cx - fw*.38, topY + fw*.05);
    ctx.lineTo(cx - fw*.22, topY - fw*.28);
    ctx.lineTo(cx - fw*.08, topY + fw*.02);
    ctx.closePath();
    ctx.fillStyle = '#ff8fb0'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    // Inner left ear
    ctx.beginPath();
    ctx.moveTo(cx - fw*.34, topY + fw*.02);
    ctx.lineTo(cx - fw*.22, topY - fw*.2);
    ctx.lineTo(cx - fw*.12, topY + fw*.0);
    ctx.closePath();
    ctx.fillStyle = '#ffb8cc'; ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.moveTo(cx + fw*.08, topY + fw*.02);
    ctx.lineTo(cx + fw*.22, topY - fw*.28);
    ctx.lineTo(cx + fw*.38, topY + fw*.05);
    ctx.closePath();
    ctx.fillStyle = '#ff8fb0'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + fw*.12, topY);
    ctx.lineTo(cx + fw*.22, topY - fw*.2);
    ctx.lineTo(cx + fw*.34, topY + fw*.02);
    ctx.closePath();
    ctx.fillStyle = '#ffb8cc'; ctx.fill();

    // Cat nose (small triangle)
    const nose = p(4);
    ctx.beginPath();
    ctx.moveTo(nose.x, nose.y - fw*.02);
    ctx.lineTo(nose.x - fw*.025, nose.y + fw*.02);
    ctx.lineTo(nose.x + fw*.025, nose.y + fw*.02);
    ctx.closePath();
    ctx.fillStyle = '#ff6688'; ctx.fill();

    // Whiskers left
    [[-.48,-.01],[-.48,.03],[-.48,.07]].forEach(([dx,dy]) => {
      ctx.beginPath();
      ctx.moveTo(nose.x - fw*.05, nose.y + fw*dy);
      ctx.lineTo(nose.x + fw*dx,  nose.y + fw*dy);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    // Whiskers right
    [[.48,-.01],[.48,.03],[.48,.07]].forEach(([dx,dy]) => {
      ctx.beginPath();
      ctx.moveTo(nose.x + fw*.05, nose.y + fw*dy);
      ctx.lineTo(nose.x + fw*dx,  nose.y + fw*dy);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    ctx.restore();
  }

  // ── 2. DOG FILTER ─────────────────────────────────────────────────────
  function drawDogFilter(p,W,H) {
    const fw = faceWidth(p), cx = faceCx(p), topY = p(10).y;

    ctx.save();
    // Floppy ears (ellipses on sides)
    ctx.beginPath();
    ctx.ellipse(cx - fw*.44, p(234).y + fw*.1, fw*.12, fw*.25, -0.3, 0, Math.PI*2);
    ctx.fillStyle = '#c8860a'; ctx.fill();
    ctx.strokeStyle = '#8B5E0A'; ctx.lineWidth = 2; ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + fw*.44, p(454).y + fw*.1, fw*.12, fw*.25, 0.3, 0, Math.PI*2);
    ctx.fillStyle = '#c8860a'; ctx.fill();
    ctx.strokeStyle = '#8B5E0A'; ctx.lineWidth = 2; ctx.stroke();

    // Dog nose (big oval)
    const nose = p(4);
    ctx.beginPath();
    ctx.ellipse(nose.x, nose.y, fw*.07, fw*.05, 0, 0, Math.PI*2);
    ctx.fillStyle = '#222'; ctx.fill();
    // Nostrils
    ctx.beginPath(); ctx.ellipse(nose.x-fw*.025, nose.y+fw*.01, fw*.018, fw*.012, 0, 0, Math.PI*2);
    ctx.fillStyle = '#333'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(nose.x+fw*.025, nose.y+fw*.01, fw*.018, fw*.012, 0, 0, Math.PI*2);
    ctx.fillStyle = '#333'; ctx.fill();

    // Tongue
    const mouth = p(13);
    ctx.beginPath();
    ctx.ellipse(mouth.x, mouth.y + fw*.08, fw*.06, fw*.09, 0, 0, Math.PI*2);
    ctx.fillStyle = '#ff4466'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(mouth.x - fw*.06, mouth.y + fw*.08);
    ctx.lineTo(mouth.x + fw*.06, mouth.y + fw*.08);
    ctx.strokeStyle = '#cc2244'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.restore();
  }

  // ── 3. WIZARD HAT ─────────────────────────────────────────────────────
  function drawWizardHat(p,W,H) {
    const fw = faceWidth(p), cx = faceCx(p), topY = p(10).y;
    const hatH = fw * 1.1;
    ctx.save();

    // Hat brim
    const bg = ctx.createLinearGradient(cx-fw*.55, topY, cx+fw*.55, topY+fw*.12);
    bg.addColorStop(0,'#3a0080'); bg.addColorStop(1,'#6a00cc');
    ctx.beginPath();
    ctx.ellipse(cx, topY + fw*.02, fw*.5, fw*.1, 0, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#b441ff'; ctx.lineWidth = 2; ctx.stroke();

    // Hat cone
    const hg = ctx.createLinearGradient(cx, topY - hatH, cx + fw*.3, topY);
    hg.addColorStop(0,'#2a0060'); hg.addColorStop(1,'#5500aa');
    ctx.beginPath();
    ctx.moveTo(cx - fw*.45, topY + fw*.04);
    ctx.lineTo(cx, topY - hatH);
    ctx.lineTo(cx + fw*.45, topY + fw*.04);
    ctx.closePath();
    ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = '#b441ff'; ctx.lineWidth = 1.5; ctx.stroke();

    // Stars on hat
    [[0, -.55],[-.18, -.3],[.18, -.25],[-.08, -.75]].forEach(([dx,dy],i) => {
      drawStar(cx + fw*dx, topY + hatH*dy, 6 + i*2, '#ffdd00');
    });

    ctx.restore();
  }

  // ── 4. PARTY HAT ──────────────────────────────────────────────────────
  function drawPartyHat(p,W,H) {
    const fw = faceWidth(p), cx = faceCx(p), topY = p(10).y;
    const hatH = fw * .85;
    ctx.save();

    // Cone
    const colors = ['#ff2d78','#ff8800','#ffdd00','#00f5ff','#b441ff'];
    for (let i=0; i<5; i++) {
      ctx.beginPath();
      const a1 = (i/5)*Math.PI, a2 = ((i+1)/5)*Math.PI;
      ctx.moveTo(cx, topY - hatH);
      ctx.arc(cx, topY + fw*.04, fw*.38, Math.PI + a1, Math.PI + a2);
      ctx.closePath();
      ctx.fillStyle = colors[i]; ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(cx, topY + fw*.04, fw*.38, fw*.08, 0, 0, Math.PI*2);
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    // Pom pom
    ctx.beginPath();
    ctx.arc(cx, topY - hatH - fw*.06, fw*.06, 0, Math.PI*2);
    ctx.fillStyle='#fff'; ctx.fill();

    // Confetti bursts
    if (frame % 3 === 0) {
      for (let i=0; i<3; i++) {
        particles.push({
          x: cx + (Math.random()-.5)*fw,
          y: topY - hatH*.3,
          vx: (Math.random()-.5)*4,
          vy: -Math.random()*5 - 2,
          color: colors[Math.floor(Math.random()*colors.length)],
          life: 1, size: 4+Math.random()*4
        });
      }
    }

    ctx.restore();
  }

  // ── 5. ROBOT MASK ─────────────────────────────────────────────────────
  function drawRobotMask(p,W,H) {
    const fw = faceWidth(p), fh = faceHeight(p);
    const cx = faceCx(p), cy = (p(10).y + p(152).y)/2;
    ctx.save();

    // Face plate
    const rg = ctx.createLinearGradient(cx-fw*.5, cy-fh*.5, cx+fw*.5, cy+fh*.5);
    rg.addColorStop(0,'rgba(40,60,80,.82)');
    rg.addColorStop(1,'rgba(20,30,50,.82)');
    ctx.beginPath();
    ctx.roundRect(cx-fw*.5, cy-fh*.48, fw, fh*.9, fw*.08);
    ctx.fillStyle=rg; ctx.fill();
    ctx.strokeStyle='#00f5ff'; ctx.lineWidth=2; ctx.stroke();

    // LED eyes
    const rEye = p(159), lEye = p(386);
    const eyeR = fw*.09;
    [rEye,lEye].forEach((e,i) => {
      // Outer ring
      ctx.beginPath(); ctx.arc(e.x, e.y, eyeR*1.3, 0, Math.PI*2);
      ctx.strokeStyle='#00aacc'; ctx.lineWidth=1.5; ctx.stroke();
      // Lens
      const eg = ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,eyeR);
      eg.addColorStop(0,'#00f5ff'); eg.addColorStop(1,'rgba(0,100,150,.4)');
      ctx.beginPath(); ctx.arc(e.x, e.y, eyeR, 0, Math.PI*2);
      ctx.fillStyle=eg; ctx.fill();
      // Scan line
      const scanOff = ((frame*2 + i*20) % (eyeR*2*10)) / 10 - eyeR;
      ctx.beginPath();
      ctx.moveTo(e.x - eyeR, e.y + scanOff);
      ctx.lineTo(e.x + eyeR, e.y + scanOff);
      ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1; ctx.stroke();
    });

    // Mouth grille
    const mouth = p(13), mY = mouth.y;
    for (let i=-2; i<=2; i++) {
      ctx.beginPath();
      ctx.roundRect(cx-fw*.28, mY + i*fw*.04 - fw*.01, fw*.56, fw*.025, fw*.01);
      ctx.fillStyle=i===0?'rgba(0,245,255,.4)':'rgba(0,180,200,.2)'; ctx.fill();
    }

    // Bolts on sides
    [[-.52,.1],[.52,.1]].forEach(([dx,dy]) => {
      ctx.beginPath(); ctx.arc(cx+fw*dx, cy+fh*dy, fw*.035, 0, Math.PI*2);
      ctx.fillStyle='#607080'; ctx.fill();
      ctx.strokeStyle='#aaa'; ctx.lineWidth=1; ctx.stroke();
    });

    ctx.restore();
  }

  // ── 6. FIRE EFFECT ────────────────────────────────────────────────────
  function drawFireEffect(p,W,H) {
    const fw = faceWidth(p), topY = p(10).y, cx = faceCx(p);

    // Spawn fire particles from forehead
    if (frame % 2 === 0) {
      for (let i=0; i<4; i++) {
        particles.push({
          x: cx + (Math.random()-.5)*fw*.6,
          y: topY - fw*.05,
          vx: (Math.random()-.5)*2,
          vy: -Math.random()*5-3,
          color: ['#ff2d00','#ff6600','#ffaa00','#ffdd00'][Math.floor(Math.random()*4)],
          life: 1, size: 6+Math.random()*8, type:'fire'
        });
      }
    }
    // Glow around head
    ctx.save();
    const fg = ctx.createRadialGradient(cx, topY-fw*.1, 0, cx, topY-fw*.1, fw*.6);
    fg.addColorStop(0,'rgba(255,100,0,.3)');
    fg.addColorStop(1,'rgba(255,0,0,0)');
    ctx.beginPath(); ctx.arc(cx, topY-fw*.1, fw*.6, 0, Math.PI*2);
    ctx.fillStyle=fg; ctx.fill();
    ctx.restore();
  }

  // ── 7. ANGEL HALO ─────────────────────────────────────────────────────
  function drawAngelHalo(p,W,H) {
    const fw = faceWidth(p), cx = faceCx(p), topY = p(10).y;
    ctx.save();

    // Glowing halo ring
    const glow = fw*.38;
    const hy   = topY - fw*.18;
    ctx.shadowColor='#ffdd00'; ctx.shadowBlur=20;
    ctx.beginPath();
    ctx.ellipse(cx, hy, glow, glow*.3, 0, 0, Math.PI*2);
    ctx.strokeStyle='#ffdd00'; ctx.lineWidth=5; ctx.stroke();

    // Inner shimmer
    ctx.shadowBlur=8;
    ctx.beginPath();
    ctx.ellipse(cx, hy, glow, glow*.3, 0, 0, Math.PI*2);
    ctx.strokeStyle='rgba(255,255,200,.6)'; ctx.lineWidth=2; ctx.stroke();

    // Sparkle dots on halo
    for (let i=0; i<8; i++) {
      const a = (i/8)*Math.PI*2 + frame*.04;
      const sx = cx + Math.cos(a)*glow;
      const sy = hy + Math.sin(a)*glow*.3;
      ctx.beginPath(); ctx.arc(sx,sy,3,0,Math.PI*2);
      ctx.fillStyle='#fff'; ctx.fill();
    }

    // White wings
    ctx.shadowColor='rgba(255,255,255,.5)'; ctx.shadowBlur=15;
    // Left wing
    ctx.beginPath();
    ctx.moveTo(cx - fw*.15, p(234).y);
    ctx.bezierCurveTo(cx-fw*.8, p(234).y-fw*.3, cx-fw*.9, p(234).y+fw*.4, cx-fw*.15, p(234).y+fw*.35);
    ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=1.5; ctx.stroke();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(cx + fw*.15, p(454).y);
    ctx.bezierCurveTo(cx+fw*.8, p(454).y-fw*.3, cx+fw*.9, p(454).y+fw*.4, cx+fw*.15, p(454).y+fw*.35);
    ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=1.5; ctx.stroke();

    ctx.restore();
  }

  // ── Sparkle trail ──────────────────────────────────────────────────────
  function drawSparkleTrail(p,W,H) {
    if (frame%2===0) {
      const pts=[p(33),p(263),p(4),p(61),p(291)];
      pts.forEach(pt=>{
        particles.push({
          x:pt.x+(Math.random()-.5)*20,
          y:pt.y+(Math.random()-.5)*20,
          vx:(Math.random()-.5)*2,
          vy:-Math.random()*2-1,
          color:['#ffdd00','#ff2d78','#00f5ff','#b441ff','#fff'][Math.floor(Math.random()*5)],
          life:1, size:3+Math.random()*4
        });
      });
    }
  }

  // ── Particle system ────────────────────────────────────────────────────
  function drawParticles(W,H) {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      if (p.type==='fire') {
        const fg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
        fg.addColorStop(0,'#ffff00'); fg.addColorStop(.5,p.color); fg.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=fg; ctx.fill();
      } else {
        drawStar(p.x, p.y, p.size, p.color);
      }
      ctx.restore();
      p.x  += p.vx; p.y  += p.vy;
      p.vy += .15; // gravity
      p.life -= .04;
    });
  }

  // ── Utilities ──────────────────────────────────────────────────────────
  function drawStar(x,y,r,col) {
    ctx.save(); ctx.translate(x,y); ctx.fillStyle=col;
    for (let a=0; a<4; a++) {
      ctx.beginPath(); ctx.rotate(Math.PI/4);
      ctx.fillRect(-r/6,-r,r/3,r*2);
    }
    ctx.restore();
  }

  window.captureARFrame = function() {
    try {
      const tmp=document.createElement('canvas');
      tmp.width=canvasEl.width; tmp.height=canvasEl.height;
      tmp.getContext('2d').drawImage(canvasEl,0,0);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({type:'capture',data:tmp.toDataURL('image/jpeg',.88)})
      );
    } catch(e){}
  };
<\/script>
</body>
</html>`;
}
