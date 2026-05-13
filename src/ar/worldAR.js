export function getWorldHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>World AR</title>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#000;overflow:hidden;font-family:monospace;touch-action:none;}
  canvas{display:block;}

  #ui{position:fixed;inset:0;z-index:200;pointer-events:none;
    display:flex;flex-direction:column;justify-content:space-between;padding:80px 16px 150px;}

  #hint{align-self:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;
    color:rgba(255,45,120,.9);background:rgba(0,0,0,.65);padding:7px 16px;
    border-radius:20px;border:1px solid rgba(255,45,120,.25);
    animation:pulse 2s ease-in-out infinite;text-align:center;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  /* Animal picker - right side */
  #animal-bar{position:fixed;right:12px;top:0;bottom:120px;
    display:flex;flex-direction:column;justify-content:center;gap:12px;z-index:201;}
  .abtn{width:54px;height:54px;border-radius:14px;
    border:2px solid rgba(255,255,255,.12);background:rgba(0,0,0,.6);
    font-size:22px;cursor:pointer;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:2px;
    -webkit-tap-highlight-color:transparent;pointer-events:all;transition:all .2s;}
  .abtn span{font-size:8px;letter-spacing:.5px;color:rgba(255,255,255,.4);}
  .abtn.active{border-color:#ff2d78;box-shadow:0 0 12px rgba(255,45,120,.4);
    background:rgba(255,45,120,.2);transform:scale(1.08);}
  .abtn.active span{color:#ff2d78;}

  /* Bottom controls */
  #bottom-bar{display:flex;align-items:center;justify-content:center;
    gap:16px;pointer-events:all;}
  .ctrl-btn{padding:9px 18px;border-radius:20px;border:1px solid rgba(255,255,255,.2);
    background:rgba(0,0,0,.6);color:#fff;font-size:11px;letter-spacing:1px;
    text-transform:uppercase;cursor:pointer;-webkit-tap-highlight-color:transparent;}
  .ctrl-btn.red{border-color:rgba(255,45,120,.5);color:#ff2d78;}
  .ctrl-btn.cyan{border-color:rgba(0,245,255,.5);color:#00f5ff;}

  #object-count{align-self:center;font-size:9px;letter-spacing:2px;
    color:rgba(255,45,120,.6);text-transform:uppercase;}

  /* Fallback */
  #fallback{display:none;position:fixed;inset:0;background:#06060f;
    flex-direction:column;align-items:center;justify-content:center;
    gap:20px;padding:32px;z-index:9999;text-align:center;}
  #fallback .icon{font-size:52px;}
  #fallback h2{font-size:18px;color:#ff2d78;letter-spacing:2px;}
  #fallback p{font-size:13px;color:rgba(200,215,255,.5);line-height:1.7;}
  #fallback .note{font-size:11px;color:rgba(255,45,120,.5);
    border:1px solid rgba(255,45,120,.2);padding:10px 16px;border-radius:8px;margin-top:4px;}

  /* Loading */
  #loading{position:fixed;inset:0;background:#06060f;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:20px;z-index:9999;}
  .spinner{width:44px;height:44px;border:3px solid rgba(255,45,120,.2);
    border-top-color:#ff2d78;border-radius:50%;animation:spin .8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  #load-msg{font-size:11px;letter-spacing:3px;color:rgba(255,45,120,.7);text-transform:uppercase;}
</style>
</head>
<body>

<div id="loading"><div class="spinner"></div><div id="load-msg">Starting AR…</div></div>

<div id="fallback">
  <div class="icon">📦</div>
  <h2>World Tracking</h2>
  <p>This feature requires <strong>ARCore</strong> which only works in the<br>
  <strong>real APK</strong>, not Expo Go.<br><br>
  Build your APK with:<br><code style="color:#ff2d78">eas build --platform android --profile preview</code></p>
  <div class="note">ARCore + WebXR Hit-Test needed</div>
</div>

<div id="ui">
  <div id="hint">● Slowly scan your floor to detect surface</div>
  <div id="object-count"></div>
  <div id="bottom-bar">
    <button class="ctrl-btn cyan" onclick="speakAll()">🔊 Talk</button>
    <button class="ctrl-btn red"  onclick="clearAll()">🗑 Clear</button>
  </div>
</div>

<!-- Animal picker -->
<div id="animal-bar">
  <button class="abtn active" data-a="fox"    onclick="pickAnimal(this)">🦊<span>FOX</span></button>
  <button class="abtn"        data-a="cat"    onclick="pickAnimal(this)">🐱<span>CAT</span></button>
  <button class="abtn"        data-a="robot"  onclick="pickAnimal(this)">🤖<span>ROBOT</span></button>
  <button class="abtn"        data-a="dragon" onclick="pickAnimal(this)">🐉<span>DRAGON</span></button>
</div>

<script>
  const loadEl    = document.getElementById('loading');
  const fallbackEl= document.getElementById('fallback');
  const hintEl    = document.getElementById('hint');
  const countEl   = document.getElementById('object-count');

  let selectedAnimal = 'fox';
  let placed = [];
  let hitTestSource = null;
  let hitTestReqd   = false;

  const voices = {
    fox:    ['Hey there! 🦊','Wanna play?','I found you!','This place smells fun!'],
    cat:    ['Meow~ 🐱','Pet me please','Zzz... purrr','Knock knock!'],
    robot:  ['HELLO HUMAN 🤖','BEEP BOOP','SCANNING AREA...','I AM FRIENDLY'],
    dragon: ['ROAARRR! 🐉','I breathe fire!','I am ancient!','Fear me... or not'],
  };

  function pickAnimal(btn) {
    document.querySelector('.abtn.active').classList.remove('active');
    btn.classList.add('active');
    selectedAnimal = btn.dataset.a;
  }

  function speakAll() {
    if (!('speechSynthesis' in window)) return;
    placed.forEach((obj,i) => {
      setTimeout(() => {
        const arr = voices[obj.animal] || voices.fox;
        const u = new SpeechSynthesisUtterance(arr[Math.floor(Math.random()*arr.length)].replace(/[^\w\s!?]/g,''));
        u.pitch = obj.animal==='cat' ? 1.8 : obj.animal==='robot' ? 0.5 : obj.animal==='dragon' ? 0.3 : 1.2;
        u.rate  = obj.animal==='robot' ? 0.7 : 1.0;
        speechSynthesis.speak(u);
      }, i * 1200);
    });
  }

  function clearAll() {
    placed.forEach(o => scene.remove(o.group));
    placed = [];
    countEl.textContent = '';
  }

  // ── Three.js ────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, .01, 40);
  scene.add(new THREE.AmbientLight(0xffffff, .8));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(0,5,5); scene.add(dir);

  // Reticle
  const rGeo = new THREE.RingGeometry(.07,.09,32); rGeo.rotateX(-Math.PI/2);
  const reticle = new THREE.Mesh(rGeo, new THREE.MeshBasicMaterial({color:0xff2d78,side:THREE.DoubleSide}));
  reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);
  const dotGeo = new THREE.CircleGeometry(.02,32); dotGeo.rotateX(-Math.PI/2);
  reticle.add(new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({color:0xffffff})));

  // ── Build character groups ──────────────────────────────────────────
  function buildFox() {
    const g = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.06,.12,8,8),
      new THREE.MeshPhongMaterial({color:0xff6600}));
    body.position.y = .12; g.add(body);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(.07,16,16),
      new THREE.MeshPhongMaterial({color:0xff6600}));
    head.position.y = .28; g.add(head);
    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(.04,12,12),
      new THREE.MeshPhongMaterial({color:0xffcc88}));
    snout.position.set(0,.27,.06); g.add(snout);
    // Ears
    [-1,1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.025,.055,6),
        new THREE.MeshPhongMaterial({color:0xff4400}));
      ear.position.set(s*.045,.35,.01); g.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(.015,.035,6),
        new THREE.MeshPhongMaterial({color:0xff8888}));
      inner.position.set(s*.045,.35,.015); g.add(inner);
    });
    // Eyes
    [-1,1].forEach(s => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.012,8,8),
        new THREE.MeshPhongMaterial({color:0x222222}));
      eye.position.set(s*.035,.295,.065); g.add(eye);
    });
    // Tail
    const tail = new THREE.Mesh(new THREE.TorusGeometry(.06,.02,8,16,Math.PI),
      new THREE.MeshPhongMaterial({color:0xff8800}));
    tail.position.set(0,.08,-.1); tail.rotation.x = .5; g.add(tail);
    // Legs
    [-1,1].forEach(s => [-1,1].forEach(f => {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.018,.06,4,4),
        new THREE.MeshPhongMaterial({color:0xff6600}));
      leg.position.set(s*.045,.04,f*.04); g.add(leg);
    }));
    return g;
  }

  function buildCat() {
    const g = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(.08,16,16),
      new THREE.MeshPhongMaterial({color:0xffa0c0}));
    body.scale.set(1,.9,1); body.position.y=.1; g.add(body);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(.07,16,16),
      new THREE.MeshPhongMaterial({color:0xffa0c0}));
    head.position.y=.24; g.add(head);
    // Cat ears (triangular)
    [-1,1].forEach(s=>{
      const ear=new THREE.Mesh(new THREE.ConeGeometry(.022,.05,4),
        new THREE.MeshPhongMaterial({color:0xee88aa}));
      ear.position.set(s*.042,.32,.01); g.add(ear);
    });
    // Eyes (big)
    [-1,1].forEach(s=>{
      const eye=new THREE.Mesh(new THREE.SphereGeometry(.018,8,8),
        new THREE.MeshPhongMaterial({color:0x44cc44,emissive:0x224400}));
      eye.position.set(s*.032,.255,.062); g.add(eye);
      const pupil=new THREE.Mesh(new THREE.SphereGeometry(.01,8,8),
        new THREE.MeshPhongMaterial({color:0x111111}));
      pupil.position.set(s*.032,.255,.07); g.add(pupil);
    });
    // Nose
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.01,8,8),
      new THREE.MeshPhongMaterial({color:0xff6688}));
    nose.position.set(0,.242,.072); g.add(nose);
    // Tail
    const tail=new THREE.Mesh(new THREE.TorusGeometry(.055,.015,8,16,Math.PI*1.5),
      new THREE.MeshPhongMaterial({color:0xee88aa}));
    tail.position.set(.06,.04,-.05); tail.rotation.x=.8; tail.rotation.z=.5; g.add(tail);
    return g;
  }

  function buildRobot() {
    const g = new THREE.Group();
    const mat  = new THREE.MeshPhongMaterial({color:0x607080,shininess:80});
    const cyan = new THREE.MeshPhongMaterial({color:0x00f5ff,emissive:0x003344});
    const red  = new THREE.MeshPhongMaterial({color:0xff2d78,emissive:0x440010});
    // Body
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.14,.18,.1),mat),{position:{x:0,y:.13,z:0}}));
    // Head
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.12,.1,.1),new THREE.MeshPhongMaterial({color:0x708090})),{position:{x:0,y:.27,z:0}}));
    // Eyes
    [-1,1].forEach(s=>{
      const eye=new THREE.Mesh(new THREE.SphereGeometry(.02,8,8),cyan);
      eye.position.set(s*.032,.28,.052); g.add(eye);
    });
    // Antenna
    const ant=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.07,8),mat);
    ant.position.y=.35; g.add(ant);
    const antTop=new THREE.Mesh(new THREE.SphereGeometry(.018,8,8),red);
    antTop.position.y=.4; g.add(antTop);
    // Arms
    [-1,1].forEach(s=>{
      const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.1,4,4),mat);
      arm.position.set(s*.1,.13,0); arm.rotation.z=s*.3; g.add(arm);
    });
    // Legs
    [-1,1].forEach(s=>{
      const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.02,.08,4,4),mat);
      leg.position.set(s*.04,.02,0); g.add(leg);
    });
    return g;
  }

  function buildDragon() {
    const g = new THREE.Group();
    const mat=new THREE.MeshPhongMaterial({color:0x228833});
    // Body
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.15,8,8),mat);
    body.position.y=.13; g.add(body);
    // Head
    const head=new THREE.Mesh(new THREE.SphereGeometry(.075,16,16),mat);
    head.position.y=.3; g.add(head);
    // Snout (elongated)
    const snout=new THREE.Mesh(new THREE.CapsuleGeometry(.03,.06,8,8),new THREE.MeshPhongMaterial({color:0x33aa44}));
    snout.rotation.x=Math.PI/2; snout.position.set(0,.28,.09); g.add(snout);
    // Horns
    [-1,1].forEach(s=>{
      const horn=new THREE.Mesh(new THREE.ConeGeometry(.015,.06,6),
        new THREE.MeshPhongMaterial({color:0xddcc00}));
      horn.position.set(s*.04,.38,.01); horn.rotation.z=-s*.3; g.add(horn);
    });
    // Eyes (glowing)
    [-1,1].forEach(s=>{
      const eye=new THREE.Mesh(new THREE.SphereGeometry(.016,8,8),
        new THREE.MeshPhongMaterial({color:0xff4400,emissive:0x441100}));
      eye.position.set(s*.038,.305,.065); g.add(eye);
    });
    // Wings
    [-1,1].forEach(s=>{
      const wing=new THREE.Mesh(
        new THREE.ConeGeometry(.08,.18,3),
        new THREE.MeshPhongMaterial({color:0x117722,transparent:true,opacity:.75})
      );
      wing.position.set(s*.14,.2,.0); wing.rotation.z=s*1.1; wing.rotation.x=.3; g.add(wing);
    });
    // Tail
    const tail=new THREE.Mesh(new THREE.TorusGeometry(.08,.02,8,16,Math.PI*1.2),
      new THREE.MeshPhongMaterial({color:0x228833}));
    tail.position.set(0,.08,-.12); tail.rotation.x=.6; g.add(tail);
    return g;
  }

  function buildCharacter(type) {
    if (type==='fox')    return buildFox();
    if (type==='cat')    return buildCat();
    if (type==='robot')  return buildRobot();
    if (type==='dragon') return buildDragon();
    return buildFox();
  }

  // Shadow ring under character
  function makeShadow() {
    const geo=new THREE.CircleGeometry(.08,32); geo.rotateX(-Math.PI/2);
    return new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.2}));
  }

  // Place character at reticle position
  function placeCharacter() {
    if (!reticle.visible) return;
    const g = buildCharacter(selectedAnimal);
    const shadow = makeShadow();
    const pos = new THREE.Vector3(); pos.setFromMatrixPosition(reticle.matrix);
    g.position.copy(pos);
    shadow.position.copy(pos); shadow.position.y += .002;
    scene.add(g); scene.add(shadow);
    placed.push({ group:g, shadow, animal:selectedAnimal, birth:Date.now() });
    countEl.textContent = placed.length + ' character' + (placed.length>1?'s':'') + ' placed';

    // Greeting voice
    if ('speechSynthesis' in window) {
      const arr=voices[selectedAnimal]||voices.fox;
      const u=new SpeechSynthesisUtterance(arr[0].replace(/[^\w\s!?]/g,''));
      u.pitch=selectedAnimal==='cat'?1.8:selectedAnimal==='robot'?0.5:selectedAnimal==='dragon'?0.3:1.2;
      u.rate =selectedAnimal==='robot'?0.7:1.0;
      speechSynthesis.speak(u);
    }
  }

  // ── Animation loop ────────────────────────────────────────────────────
  renderer.setAnimationLoop((ts, frame) => {
    if (frame) {
      const refSpace = renderer.xr.getReferenceSpace();
      const session  = renderer.xr.getSession();

      if (!hitTestReqd) {
        session.requestReferenceSpace('viewer').then(vs => {
          session.requestHitTestSource({space:vs}).then(src => { hitTestSource=src; });
        });
        session.addEventListener('end', () => { hitTestReqd=false; hitTestSource=null; });
        hitTestReqd=true;
      }

      if (hitTestSource) {
        const hits=frame.getHitTestResults(hitTestSource);
        if (hits.length>0) {
          const pose=hits[0].getPose(refSpace);
          reticle.visible=true;
          reticle.matrix.fromArray(pose.transform.matrix);
          hintEl.textContent='✓ Surface found — tap to place character';
          hintEl.style.color='#00ff88'; hintEl.style.animation='none';
        } else {
          reticle.visible=false;
          hintEl.textContent='● Slowly scan your floor to detect surface';
          hintEl.style.color='rgba(255,45,120,.9)';
          hintEl.style.animation='pulse 2s ease-in-out infinite';
        }
      }
    }

    // Animate placed characters
    const t = Date.now();
    placed.forEach((o,i) => {
      const age=(t - o.birth)/1000;
      o.group.position.y += Math.sin(age*2 + i)*.0003;
      o.group.rotation.y += .008;
    });

    renderer.render(scene, camera);
  });

  // ── Start AR ───────────────────────────────────────────────────────────
  async function startAR() {
    if (!navigator.xr) { loadEl.style.display='none'; fallbackEl.style.display='flex'; return; }
    const ok = await navigator.xr.isSessionSupported('immersive-ar').catch(()=>false);
    if (!ok) { loadEl.style.display='none'; fallbackEl.style.display='flex'; return; }

    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures:['hit-test'],
        optionalFeatures:['dom-overlay'],
        domOverlay:{root:document.getElementById('ui')}
      });
      renderer.xr.setSession(session);
      loadEl.style.display='none';
      session.addEventListener('select', placeCharacter);
    } catch(e) { loadEl.style.display='none'; fallbackEl.style.display='flex'; }
  }
  startAR();

  window.captureARFrame = function() {
    try {
      const data=renderer.domElement.toDataURL('image/jpeg',.88);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({type:'capture',data})
      );
    } catch(e) {}
  };
<\/script>
</body>
</html>`;
}
