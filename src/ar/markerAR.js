export function getMarkerHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>Marker AR</title>
<script src="https://aframe.io/releases/1.4.2/aframe.min.js"><\/script>
<script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#000;overflow:hidden;font-family:monospace;}
  a-scene{position:fixed!important;inset:0!important;z-index:1!important;}
  #status{position:fixed;bottom:150px;left:50%;transform:translateX(-50%);
    font-size:10px;letter-spacing:3px;text-transform:uppercase;
    color:rgba(0,245,255,.85);background:rgba(0,0,0,.65);padding:7px 16px;
    border-radius:20px;border:1px solid rgba(0,245,255,.2);z-index:200;
    white-space:nowrap;animation:pulse 2s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  #reticle{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    width:160px;height:160px;z-index:198;pointer-events:none;}
  .c{position:absolute;width:28px;height:28px;border:2.5px solid rgba(0,245,255,.6);}
  .tl{top:0;left:0;border-right:none;border-bottom:none;border-radius:3px 0 0 0;}
  .tr{top:0;right:0;border-left:none;border-bottom:none;border-radius:0 3px 0 0;}
  .bl{bottom:0;left:0;border-right:none;border-top:none;border-radius:0 0 0 3px;}
  .br{bottom:0;right:0;border-left:none;border-top:none;border-radius:0 0 3px 0;}
  #hint{position:fixed;bottom:200px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,.85);border:1px solid rgba(0,245,255,.25);
    border-radius:14px;padding:16px 20px;z-index:200;max-width:300px;text-align:center;}
  #hint h3{color:#00f5ff;font-size:13px;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase;}
  #hint p{color:rgba(200,215,255,.55);font-size:12px;line-height:1.6;margin-bottom:10px;}
  #marker-img{width:70px;height:70px;border:2px solid rgba(0,245,255,.4);
    border-radius:6px;background:#fff;padding:3px;display:block;margin:0 auto 10px;}
  #hint button{background:#00f5ff;color:#000;border:none;padding:8px 20px;
    border-radius:8px;font-size:11px;font-weight:700;letter-spacing:2px;
    text-transform:uppercase;cursor:pointer;width:100%;}
  #char-picker{position:fixed;top:100px;right:12px;display:flex;flex-direction:column;
    gap:10px;z-index:200;}
  .cpick{width:50px;height:50px;border-radius:12px;border:2px solid rgba(255,255,255,.15);
    background:rgba(0,0,0,.6);font-size:22px;cursor:pointer;display:flex;
    align-items:center;justify-content:center;transition:all .2s;}
  .cpick.active{border-color:#00f5ff;box-shadow:0 0 12px rgba(0,245,255,.4);
    background:rgba(0,245,255,.15);}
</style>
</head>
<body>

<a-scene embedded
  arjs="sourceType:webcam;debugUIEnabled:false;detectionMode:mono_and_matrix;matrixCodeType:3x3;"
  renderer="logarithmicDepthBuffer:true;antialias:true;"
  vr-mode-ui="enabled:false">

  <a-assets>
    <a-asset-item id="fox"  src="https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models/2.0/Fox/glTF-Binary/Fox.glb"></a-asset-item>
    <a-asset-item id="duck" src="https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb"></a-asset-item>
  </a-assets>

  <a-marker preset="hiro" smooth="true" smoothCount="5" smoothTolerance=".01">

    <!-- Glowing platform ring -->
    <a-torus position="0 0.02 0" radius=".6" radius-tubular=".015" color="#00f5ff" opacity=".6"
      animation="property:rotation;to:0 360 0;loop:true;dur:4000;easing:linear;"></a-torus>
    <a-cylinder position="0 0.01 0" radius=".55" height=".015" color="#00f5ff" opacity=".12"
      animation="property:material.opacity;from:.08;to:.25;dir:alternate;loop:true;dur:1500;"></a-cylinder>

    <!-- FOX character (default visible) -->
    <a-entity id="fox-entity"
      gltf-model="#fox"
      position="0 0 0" scale=".0045 .0045 .0045" rotation="0 0 0"
      animation-mixer="clip:Survey;loop:repeat;"
      animation__idle="property:position;from:0 0 0;to:0 .04 0;dir:alternate;loop:true;dur:2000;easing:easeInOutSine;"
      animation__turn="property:rotation;to:0 360 0;loop:true;dur:10000;easing:linear;">
    </a-entity>

    <!-- DUCK character (hidden by default) -->
    <a-entity id="duck-entity" visible="false"
      gltf-model="#duck"
      position="0 0.05 0" scale=".008 .008 .008"
      animation__float="property:position;from:0 .05 0;to:0 .18 0;dir:alternate;loop:true;dur:1800;easing:easeInOutSine;"
      animation__spin="property:rotation;to:0 360 0;loop:true;dur:6000;easing:linear;">
    </a-entity>

    <!-- ROBOT character (primitive-based, hidden by default) -->
    <a-entity id="robot-entity" visible="false"
      animation__float="property:position;from:0 .1 0;to:0 .25 0;dir:alternate;loop:true;dur:1600;easing:easeInOutSine;">
      <!-- Body -->
      <a-box position="0 .15 0" width=".22" height=".25" depth=".14" color="#607080"
        animation__glow="property:material.emissive;from:#001020;to:#003050;dir:alternate;loop:true;dur:900;"></a-box>
      <!-- Head -->
      <a-box position="0 .42 0" width=".2" height=".18" depth=".14" color="#708090"></a-box>
      <!-- Eyes -->
      <a-sphere position="-.05 .44 .08" radius=".035" color="#00f5ff"
        animation="property:material.emissive;from:#00aacc;to:#00f5ff;dir:alternate;loop:true;dur:600;"></a-sphere>
      <a-sphere position=".05 .44 .08" radius=".035" color="#00f5ff"
        animation="property:material.emissive;from:#00aacc;to:#00f5ff;dir:alternate;loop:true;dur:600;"></a-sphere>
      <!-- Antenna -->
      <a-cylinder position="0 .58 0" radius=".012" height=".12" color="#aaa"></a-cylinder>
      <a-sphere position="0 .66 0" radius=".035" color="#ff2d78"
        animation="property:material.emissive;from:#aa0030;to:#ff2d78;dir:alternate;loop:true;dur:400;"></a-sphere>
      <!-- Arms -->
      <a-cylinder position="-.16 .15 0" radius=".03" height=".18" color="#607080" rotation="0 0 30"></a-cylinder>
      <a-cylinder position=".16 .15 0" radius=".03" height=".18" color="#607080" rotation="0 0 -30"
        animation="property:rotation;from:0 0 -30;to:0 0 -60;dir:alternate;loop:true;dur:800;"></a-cylinder>
    </a-entity>

    <!-- Speech bubble (floats above character) -->
    <a-entity id="bubble"
      position=".35 .6 0"
      animation__float="property:position;from:.35 .6 0;to:.35 .75 0;dir:alternate;loop:true;dur:2200;easing:easeInOutSine;">
      <a-plane id="bubble-bg" width=".55" height=".22" color="#fff" opacity=".92" border-radius=".06"></a-plane>
      <a-text id="bubble-text" value="Hi! I'm Foxy! 🦊" align="center" color="#222" width=".9" position="0 0 .01"></a-text>
      <a-sphere position="-.05 -.13 0" radius=".04" color="#fff" opacity=".92"></a-sphere>
      <a-sphere position="-.12 -.2 0" radius=".028" color="#fff" opacity=".85"></a-sphere>
    </a-entity>

    <!-- Orbiting sparkles -->
    <a-entity animation="property:rotation;to:0 360 0;loop:true;dur:2800;easing:linear;">
      <a-sphere position=".65 .35 0" radius=".055" color="#ff2d78"
        animation="property:scale;from:1 1 1;to:1.5 1.5 1.5;dir:alternate;loop:true;dur:600;"></a-sphere>
    </a-entity>
    <a-entity animation="property:rotation;to:0 -360 0;loop:true;dur:3600;easing:linear;">
      <a-sphere position=".55 .45 .3" radius=".04" color="#ffdd00"
        animation="property:scale;from:1 1 1;to:1.4 1.4 1.4;dir:alternate;loop:true;dur:700;"></a-sphere>
    </a-entity>
    <a-entity animation="property:rotation;to:360 360 0;loop:true;dur:5000;easing:linear;">
      <a-sphere position="0 .7 .6" radius=".035" color="#b441ff"></a-sphere>
    </a-entity>

  </a-marker>
  <a-entity camera></a-entity>
</a-scene>

<!-- Scanning reticle -->
<div id="reticle">
  <div class="c tl"></div><div class="c tr"></div>
  <div class="c bl"></div><div class="c br"></div>
</div>

<!-- Character picker (right side) -->
<div id="char-picker" style="display:none">
  <button class="cpick active" onclick="switchChar('fox')" title="Fox">🦊</button>
  <button class="cpick"        onclick="switchChar('duck')" title="Duck">🦆</button>
  <button class="cpick"        onclick="switchChar('robot')" title="Robot">🤖</button>
</div>

<!-- Hint card -->
<div id="hint">
  <h3>🖼️ Show the Hiro Marker</h3>
  <img id="marker-img" src="https://raw.githack.com/AR-js-org/AR.js/master/data/images/hiro.png" alt="Hiro">
  <p>Point camera at <strong>this pattern</strong>.<br>A talking Fox appears! Switch characters with the side buttons.</p>
  <button onclick="document.getElementById('hint').style.display='none'">Start →</button>
</div>

<div id="status">● Point camera at the Hiro marker</div>

<script>
  const sayings = {
    fox:   ['Hi! I\'m Foxy! 🦊', 'Wanna play? 🎮', 'You found me! ✨', 'Rawr! 🦊'],
    duck:  ['Quack quack! 🦆', 'I can fly! 🦆', 'Water please 💧', 'Quaaack! 😄'],
    robot: ['BEEP BOOP 🤖', 'HELLO HUMAN', 'SCANNING... ✅', 'I AM ROBOT 🤖'],
  };
  let curChar = 'fox';
  let sayIdx  = 0;

  function switchChar(name) {
    document.querySelectorAll('.cpick').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('fox-entity').setAttribute('visible',   name==='fox');
    document.getElementById('duck-entity').setAttribute('visible',  name==='duck');
    document.getElementById('robot-entity').setAttribute('visible', name==='robot');
    curChar = name;
    sayIdx  = 0;
    updateBubble();
    // Speak with Web Speech API
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(sayings[name][0].replace(/[^\w\s!]/g,''));
      u.rate  = name==='robot' ? 0.7 : 1.1;
      u.pitch = name==='duck'  ? 1.8 : name==='robot' ? 0.5 : 1.2;
      speechSynthesis.speak(u);
    }
  }

  function updateBubble() {
    const msgs = sayings[curChar];
    document.getElementById('bubble-text').setAttribute('value', msgs[sayIdx % msgs.length]);
    sayIdx++;
    setTimeout(updateBubble, 3000);
  }

  const marker = document.querySelector('a-marker');
  const status = document.getElementById('status');
  const picker = document.getElementById('char-picker');
  const reticle= document.getElementById('reticle');

  marker.addEventListener('markerFound', () => {
    reticle.style.opacity = '0';
    picker.style.display  = 'flex';
    status.textContent    = '✓ Tap a character on the right!';
    status.style.color    = '#00ff88';
    status.style.animation= 'none';
    updateBubble();
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Hi! I'm Foxy!");
      u.pitch = 1.3; u.rate = 1.1;
      speechSynthesis.speak(u);
    }
  });
  marker.addEventListener('markerLost', () => {
    reticle.style.opacity = '0.8';
    picker.style.display  = 'none';
    status.textContent    = '● Point camera at the Hiro marker';
    status.style.color    = 'rgba(0,245,255,.85)';
    status.style.animation= 'pulse 2s ease-in-out infinite';
  });

  window.captureARFrame = function() {
    try {
      const c = document.querySelector('canvas');
      if (!c) return;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type:'capture', data: c.toDataURL('image/jpeg', .88) })
      );
    } catch(e) {}
  };
<\/script>
</body>
</html>`;
}
