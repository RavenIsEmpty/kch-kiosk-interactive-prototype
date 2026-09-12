(function(){
  'use strict';
  const root = document.getElementById('viewer');
  const canvasHost = document.getElementById('canvas-host');
  const statusEl = document.getElementById('status-text');
  const stepTitle = document.getElementById('step-title');
  const stepKh = document.getElementById('step-kh');
  const stepBody = document.getElementById('step-body');
  const stepNum = document.getElementById('step-number');
  const progressBar = document.getElementById('progress-bar');
  const startBtn = document.getElementById('start-demo');
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const autoBtn = document.getElementById('auto-rotate');
  const resetBtn = document.getElementById('reset-view');
  const beamToggle = document.getElementById('beam-toggle');
  const viewButtons = Array.from(document.querySelectorAll('[data-view]'));

  if (!window.THREE) {
    statusEl.textContent = '3D library failed to load. Check your internet connection.';
    return;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1f5f5);
  scene.fog = new THREE.Fog(0xf1f5f5, 5.5, 10);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 30);
  camera.position.set(2.75, 1.65, -3.25);
  camera.lookAt(0, 1.02, -0.08);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  canvasHost.appendChild(renderer.domElement);

  const world = new THREE.Group();
  scene.add(world);

  // Lighting
  scene.add(new THREE.HemisphereLight(0xffffff, 0x667779, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.15);
  key.position.set(-3.2, 5.2, -4.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -1;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc8ffff, 0.75);
  fill.position.set(4, 2.2, -2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.85);
  rim.position.set(1.5, 3.5, 4);
  scene.add(rim);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0xe9eeee, roughness: 0.95, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const mat = {
    white: () => new THREE.MeshPhysicalMaterial({ color: 0xf5f6f2, roughness: 0.34, metalness: 0.02, clearcoat: 0.15, clearcoatRoughness: 0.55, emissive: 0x000000 }),
    teal: () => new THREE.MeshPhysicalMaterial({ color: 0x078884, roughness: 0.3, metalness: 0.12, clearcoat: 0.22, clearcoatRoughness: 0.4, emissive: 0x000000 }),
    tealDark: () => new THREE.MeshStandardMaterial({ color: 0x07545a, roughness: 0.36, metalness: 0.12, emissive: 0x000000 }),
    black: () => new THREE.MeshStandardMaterial({ color: 0x15191b, roughness: 0.55, metalness: 0.05, emissive: 0x000000 }),
    charcoal: () => new THREE.MeshStandardMaterial({ color: 0x3b4244, roughness: 0.87, metalness: 0.02, emissive: 0x000000 }),
    metal: () => new THREE.MeshStandardMaterial({ color: 0x99a3a5, roughness: 0.27, metalness: 0.7, emissive: 0x000000 }),
    cuff: () => new THREE.MeshStandardMaterial({ color: 0x2b3033, roughness: 0.78, metalness: 0, emissive: 0x000000 }),
    glow: () => new THREE.MeshStandardMaterial({ color: 0x24d3bf, roughness: 0.26, metalness: 0.1, emissive: 0x0a5f58, emissiveIntensity: 0.7 })
  };

  const components = {};
  function register(name, obj) {
    if (!components[name]) components[name] = [];
    components[name].push(obj);
    return obj;
  }

  function roundedBox(w,h,d,r,material) {
    // Beveled box using ExtrudeGeometry for a premium product-shell feel.
    const s = new THREE.Shape();
    const x=-w/2, y=-h/2, rr=Math.min(r,w/2,h/2);
    s.moveTo(x+rr,y);
    s.lineTo(x+w-rr,y); s.quadraticCurveTo(x+w,y,x+w,y+rr);
    s.lineTo(x+w,y+h-rr); s.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
    s.lineTo(x+rr,y+h); s.quadraticCurveTo(x,y+h,x,y+h-rr);
    s.lineTo(x,y+rr); s.quadraticCurveTo(x,y,x+rr,y);
    const g = new THREE.ExtrudeGeometry(s,{ depth:d, bevelEnabled:true, bevelSegments:3, steps:1, bevelSize:Math.min(.008,rr*.35), bevelThickness:Math.min(.008,d*.12), curveSegments:8 });
    g.center();
    const m = new THREE.Mesh(g, material);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  function box(name,w,h,d,x,y,z,material,r=.025,rx=0,ry=0,rz=0){
    const m=roundedBox(w,h,d,r,material);
    m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
    world.add(m); if(name) register(name,m); return m;
  }

  // --- Locked concept geometry (meters) ---
  // Platform 620 x 540 x 55 mm
  box('weight', .62,.055,.54, 0,.028,-.285, mat.teal(), .035);
  box('weight', .585,.028,.505, 0,.071,-.285, mat.charcoal(), .028);
  // foot guides
  const footMat = new THREE.MeshStandardMaterial({ color:0xb8c4c3, roughness:.7, emissive:0x000000 });
  box('weight', .095,.012,.205,-.105,.092,-.285, footMat.clone(), .04);
  box('weight', .095,.012,.205, .105,.092,-.285, footMat.clone(), .04);

  // Cabinet body depth 360 mm sitting at rear edge of platform
  // Teal structural spine and rear service column
  box('body', .16,1.82,.25,-.155,1.03,.205,mat.teal(),.045);
  box('body', .31,1.73,.35,.10,.955,.15,mat.white(),.055);
  // Rear service door seam and vents
  box('service', .20,.56,.012,.10,.88,.332,mat.white(),.015);
  for(let i=0;i<5;i++) box('service', .115,.009,.012,.10,.49+i*.034,.341,mat.black(),.002);

  // Sculpted front shell, layered white/teal forms
  box('body', .49,.78,.15,-.035,.59,-.015,mat.teal(),.07,-.06,0,0);
  box('body', .455,.75,.12,-.035,.61,-.095,mat.white(),.065,-.06,0,0);
  box('body', .49,.78,.15,-.035,1.285,-.02,mat.teal(),.07,-.11,0,0);
  box('body', .455,.75,.12,-.035,1.305,-.105,mat.white(),.065,-.11,0,0);

  // Screen group: 21.5" portrait ~267 x 475 mm, center 1180mm, top back 10°
  const screenGroup = new THREE.Group();
  screenGroup.position.set(-.035,1.18,-.188);
  screenGroup.rotation.x = THREE.MathUtils.degToRad(-10); // top edge back toward cabinet
  world.add(screenGroup);
  const bezel = roundedBox(.315,.535,.035,.03,mat.black()); bezel.position.z=0; screenGroup.add(bezel); register('screen',bezel);

  const screenCanvas=document.createElement('canvas'); screenCanvas.width=540; screenCanvas.height=900;
  const screenCtx=screenCanvas.getContext('2d');
  const screenTex=new THREE.CanvasTexture(screenCanvas); screenTex.encoding=THREE.sRGBEncoding;
  const display=new THREE.Mesh(new THREE.PlaneGeometry(.282,.494),new THREE.MeshBasicMaterial({map:screenTex}));
  display.position.z=-.0205; display.rotation.y=Math.PI; screenGroup.add(display); register('screen',display);

  // Screen speakers
  for(const sx of [-.115,.115]){
    const sp=new THREE.Mesh(new THREE.CircleGeometry(.012,20),mat.tealDark());
    sp.position.set(sx,.235,-.0215); sp.rotation.y=Math.PI; screenGroup.add(sp);
  }

  // Front controls: QR, printer, status ring
  box('qr', .075,.072,.028,-.13,.88,-.178,mat.black(),.01,-.06,0,0);
  box('printer', .12,.055,.03,.07,.88,-.18,mat.black(),.01,-.06,0,0);
  const statusRing=new THREE.Mesh(new THREE.TorusGeometry(.047,.009,16,48),mat.glow());
  statusRing.position.set(-.025,.785,-.188); statusRing.rotation.x=-.06; world.add(statusRing); register('status',statusRing);

  // Height mast and arm
  box('height', .105,2.02,.105,-.18,1.06,.285,mat.white(),.035);
  box('height', .048,1.98,.024,-.18,1.06,.225,mat.teal(),.009);
  // arm from rear mast to standing center (~580mm reach)
  box('height', .11,.095,.58,-.18,2.045,-.005,mat.white(),.045);
  box('height', .05,.026,.56,-.18,2.088,-.005,mat.teal(),.012);
  const sensorHousing=roundedBox(.105,.06,.09,.025,mat.black()); sensorHousing.position.set(-.18,1.995,-.285); world.add(sensorHousing); register('height',sensorHousing);
  const sensorLens=new THREE.Mesh(new THREE.CircleGeometry(.026,32),mat.glow());
  sensorLens.position.set(-.18,1.963,-.285); sensorLens.rotation.x=Math.PI/2; world.add(sensorLens); register('height',sensorLens);

  // Height beam
  const beamMat=new THREE.MeshBasicMaterial({color:0x1bc9bf,transparent:true,opacity:.20,depthWrite:false});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.01,.035,1.86,20,1,true),beamMat);
  beam.position.set(-.18,1.035,-.285); world.add(beam); register('heightBeam',beam);

  // BP station on USER RIGHT / image-right (+X)
  box('bp', .105,.30,.13,.335,1.075,.02,mat.white(),.03);
  box('bp', .29,.042,.27,.39,.985,-.115,mat.white(),.025);
  box('bp', .29,.012,.27,.39,1.013,-.115,mat.teal(),.009);
  // Cuff facing user, torus plane XY normal along Z
  const cuffOuter=new THREE.Mesh(new THREE.TorusGeometry(.085,.027,28,72),mat.cuff());
  cuffOuter.position.set(.40,1.105,-.255); world.add(cuffOuter); register('bp',cuffOuter);
  const cuffTrim=new THREE.Mesh(new THREE.TorusGeometry(.089,.008,20,72),mat.teal());
  cuffTrim.position.set(.40,1.105,-.262); world.add(cuffTrim); register('bp',cuffTrim);
  // short controlled hose
  const hoseCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(.47,1.05,-.25), new THREE.Vector3(.49,.99,-.20), new THREE.Vector3(.46,.94,-.13), new THREE.Vector3(.40,.94,-.08)
  ]);
  const hose=new THREE.Mesh(new THREE.TubeGeometry(hoseCurve,24,.008,10,false),mat.cuff()); world.add(hose); register('bp',hose);

  // Glucose sensor below/inward, angled upward to user
  const glucoseGroup=new THREE.Group(); glucoseGroup.position.set(.32,.92,-.175); glucoseGroup.rotation.x=THREE.MathUtils.degToRad(-18); world.add(glucoseGroup);
  const gh=roundedBox(.12,.09,.075,.025,mat.white()); glucoseGroup.add(gh); register('glucose',gh);
  const gp=roundedBox(.075,.038,.012,.012,mat.black()); gp.position.set(0,.015,-.044); glucoseGroup.add(gp); register('glucose',gp);
  const gl=new THREE.Mesh(new THREE.SphereGeometry(.014,24,16),mat.glow()); gl.position.set(0,.017,-.052); glucoseGroup.add(gl); register('glucose',gl);

  // Small base speaker grille
  for(let i=0;i<3;i++){
    const dot=new THREE.Mesh(new THREE.CircleGeometry(.006,16),mat.tealDark());
    dot.position.set(-.04+i*.018,.70,-.176); dot.rotation.y=Math.PI; world.add(dot);
  }

  // Subtle KCH top mark
  const logoCanvas=document.createElement('canvas'); logoCanvas.width=512; logoCanvas.height=128;
  const lctx=logoCanvas.getContext('2d'); lctx.clearRect(0,0,512,128); lctx.fillStyle='#087f80'; lctx.font='700 70px Arial'; lctx.textAlign='center'; lctx.fillText('KCH',256,82);
  const logoTex=new THREE.CanvasTexture(logoCanvas); logoTex.encoding=THREE.sRGBEncoding;
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(.18,.045),new THREE.MeshBasicMaterial({map:logoTex,transparent:true}));
  logo.position.set(.065,1.69,-.185); logo.rotation.y=Math.PI; world.add(logo);

  // Dynamic screen UI
  function roundedRect(ctx,x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
  function drawScreen(step){
    const ctx=screenCtx,W=screenCanvas.width,H=screenCanvas.height;
    ctx.fillStyle='#f4fbfa'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#087f80'; ctx.fillRect(0,0,W,90);
    ctx.fillStyle='white'; ctx.font='700 48px Arial'; ctx.textAlign='center'; ctx.fillText('KCH',W/2,60);
    ctx.fillStyle='#1c3b3c'; ctx.font='700 30px Arial'; ctx.fillText(step.screenTitle,W/2,170);
    ctx.fillStyle='#597071'; ctx.font='24px Arial';
    const lines=step.screenLines || [];
    lines.forEach((t,i)=>ctx.fillText(t,W/2,220+i*40));
    if(step.result){
      const vals=[['Height','168 cm'],['Weight','62 kg'],['BMI','22.0'],['BP','118/76'],['Pulse','72 bpm'],['Glucose','102 mg/dL']];
      ctx.textAlign='left'; ctx.font='22px Arial';
      vals.forEach((v,i)=>{const col=i%2,row=Math.floor(i/2); const x=45+col*245,y=340+row*110; ctx.fillStyle='#e4f4f2'; roundedRect(ctx,x,y,210,82,18);ctx.fill();ctx.fillStyle='#456263';ctx.fillText(v[0],x+18,y+28);ctx.fillStyle='#087f80';ctx.font='700 25px Arial';ctx.fillText(v[1],x+18,y+60);ctx.font='22px Arial';});
      ctx.fillStyle='#dff6e8'; roundedRect(ctx,45,685,450,74,18); ctx.fill(); ctx.fillStyle='#147245';ctx.textAlign='center';ctx.font='700 26px Arial';ctx.fillText('LOW RISK • Keep healthy habits',W/2,731);
    } else {
      ctx.fillStyle='#0ba7a1'; roundedRect(ctx,95,610,350,90,45); ctx.fill();
      ctx.fillStyle='white'; ctx.textAlign='center'; ctx.font='700 30px Arial'; ctx.fillText(step.cta || 'Continue',W/2,665);
      ctx.fillStyle='#cde9e6'; ctx.font='20px Arial';ctx.fillText('Khmer voice guidance enabled',W/2,790);
    }
    screenTex.needsUpdate=true;
  }

  const steps=[
    { title:'Welcome & Login', kh:'ចាប់ផ្តើម និងចូលប្រើ', body:'Tap the screen, scan a QR code, enter a phone number, or continue as guest.', screenTitle:'Welcome to KCH', screenLines:['Self-service health screening','សូមស្វាគមន៍'], cta:'TAP TO START', key:'screen', rot:0.35 },
    { title:'Stand for Height & Weight', kh:'វាស់កម្ពស់ និងទម្ងន់', body:'Stand naturally on both foot guides. The overhead sensor measures height while the platform measures weight.', screenTitle:'Height + Weight', screenLines:['Stand on the footprints','ឈរលើសញ្ញាជើង'], cta:'MEASURING…', key:'weight', rot:0.15, beam:true },
    { title:'Measure Blood Pressure', kh:'វាស់សម្ពាធឈាម', body:'Place your right arm through the cuff and rest your forearm on the support tray. Keep still during measurement.', screenTitle:'Blood Pressure', screenLines:['Insert right arm into cuff','សូមដាក់ដៃស្តាំ'], cta:'START BP', key:'bp', rot:-0.58 },
    { title:'Check Optical Glucose', kh:'វាស់ជាតិស្ករ', body:'Move the same hand down to the optical sensor and place one fingertip flat on the illuminated pad.', screenTitle:'Optical Glucose', screenLines:['Place fingertip on sensor','ដាក់ម្រាមដៃលើសិនស័រ'], cta:'SCAN FINGER', key:'glucose', rot:-0.52 },
    { title:'AI Analysis', kh:'AI វិភាគលទ្ធផល', body:'The kiosk combines the measurements, calculates BMI and risk level, then prepares guidance.', screenTitle:'Analyzing Results', screenLines:['AI is checking your measurements','កំពុងវិភាគលទ្ធផល'], cta:'PLEASE WAIT', key:'status', rot:0.24 },
    { title:'Results, QR & Receipt', kh:'លទ្ធផល និងបង្កាន់ដៃ', body:'Review your results, scan the QR record, or print a receipt. The session clears when you finish.', screenTitle:'Your Health Results', screenLines:['Screening complete','លទ្ធផលរួចរាល់'], result:true, key:'printer', rot:0.28 }
  ];

  let currentStep=0, playing=false, playTimer=null, autoRotate=false;
  let targetRotY=0.28, targetRotX=0, rotY=0.28, rotX=0;
  let dragging=false,lastX=0,lastY=0;
  let cameraFov=32;
  let currentHighlight=null;

  function setHighlight(key){
    currentHighlight=key;
    Object.keys(components).forEach(k=>{
      components[k].forEach(obj=>{
        if(!obj.material) return;
        const materials=Array.isArray(obj.material)?obj.material:[obj.material];
        materials.forEach(m=>{
          if(!m.emissive) return;
          if(k===key){m.emissive.setHex(0x0a5f58);m.emissiveIntensity=0.75;}
          else if(k!=='status' && k!=='heightBeam'){m.emissive.setHex(0x000000);m.emissiveIntensity=0;}
        });
      });
    });
  }

  function renderStep(index,fromAuto){
    currentStep=Math.max(0,Math.min(steps.length-1,index));
    const s=steps[currentStep];
    stepNum.textContent=(currentStep+1)+' / '+steps.length;
    stepTitle.textContent=s.title; stepKh.textContent=s.kh; stepBody.textContent=s.body;
    progressBar.style.width=((currentStep+1)/steps.length*100)+'%';
    targetRotY=s.rot; targetRotX=0;
    beam.visible=!!s.beam && beamToggle.checked;
    setHighlight(s.key);
    drawScreen(s);
    prevBtn.disabled=currentStep===0;
    nextBtn.textContent=currentStep===steps.length-1?'Restart':'Next step';
    statusEl.textContent='Demo step '+(currentStep+1)+': '+s.title;
    if(fromAuto && playing) scheduleNext();
  }

  function scheduleNext(){
    clearTimeout(playTimer);
    if(currentStep>=steps.length-1){
      playTimer=setTimeout(()=>{playing=false;startBtn.textContent='▶ Start guided demo';},4500);
      return;
    }
    playTimer=setTimeout(()=>renderStep(currentStep+1,true),4200);
  }

  startBtn.addEventListener('click',()=>{
    if(playing){playing=false;clearTimeout(playTimer);startBtn.textContent='▶ Resume demo';return;}
    if(currentStep>=steps.length-1) currentStep=0;
    playing=true;startBtn.textContent='❚❚ Pause demo';renderStep(currentStep,true);
  });
  prevBtn.addEventListener('click',()=>{playing=false;clearTimeout(playTimer);startBtn.textContent='▶ Start guided demo';renderStep(currentStep-1,false);});
  nextBtn.addEventListener('click',()=>{playing=false;clearTimeout(playTimer);startBtn.textContent='▶ Start guided demo';renderStep(currentStep===steps.length-1?0:currentStep+1,false);});
  autoBtn.addEventListener('click',()=>{autoRotate=!autoRotate;autoBtn.classList.toggle('active',autoRotate);autoBtn.textContent=autoRotate?'Auto rotate: On':'Auto rotate';});
  resetBtn.addEventListener('click',()=>{targetRotY=.28;targetRotX=0;cameraFov=32;camera.fov=cameraFov;camera.updateProjectionMatrix();});
  beamToggle.addEventListener('change',()=>{beam.visible=beamToggle.checked && !!steps[currentStep].beam;});

  const viewMap={front:0,right:-Math.PI/2,back:Math.PI,left:Math.PI/2,three:.52};
  viewButtons.forEach(btn=>btn.addEventListener('click',()=>{targetRotY=viewMap[btn.dataset.view]; targetRotX=0; statusEl.textContent=btn.textContent+' view';}));

  // Pointer/touch controls
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;targetRotY+=dx*.008;targetRotX+=dy*.004;targetRotX=Math.max(-.18,Math.min(.18,targetRotX));lastX=e.clientX;lastY=e.clientY;});
  canvas.addEventListener('pointerup',e=>{dragging=false;try{canvas.releasePointerCapture(e.pointerId);}catch(_){}});
  canvas.addEventListener('pointercancel',()=>dragging=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();cameraFov+=e.deltaY*.018;cameraFov=Math.max(22,Math.min(48,cameraFov));camera.fov=cameraFov;camera.updateProjectionMatrix();},{passive:false});

  // Simple pinch zoom
  const touches=new Map();let pinchStart=0,pinchFov=32;
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const a=[...touches.values()];pinchStart=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);pinchFov=cameraFov;}}});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&touches.has(e.pointerId)){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2&&pinchStart){const a=[...touches.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);cameraFov=Math.max(22,Math.min(48,pinchFov*(pinchStart/Math.max(20,d))));camera.fov=cameraFov;camera.updateProjectionMatrix();}}});
  function clearTouch(e){touches.delete(e.pointerId);if(touches.size<2)pinchStart=0;}
  canvas.addEventListener('pointerup',clearTouch); canvas.addEventListener('pointercancel',clearTouch);

  function resize(){
    const r=canvasHost.getBoundingClientRect(); const w=Math.max(320,r.width),h=Math.max(360,r.height);
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvasHost); resize();

  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(.04,clock.getDelta());
    if(autoRotate&&!dragging&&!playing) targetRotY+=dt*.25;
    rotY += (targetRotY-rotY)*Math.min(1,dt*7.5);
    rotX += (targetRotX-rotX)*Math.min(1,dt*7.5);
    world.rotation.y=rotY; world.rotation.x=rotX;
    // subtle pulse on active component
    const t=performance.now()*.003;
    if(currentHighlight&&components[currentHighlight]){
      components[currentHighlight].forEach(obj=>{
        if(!obj.material)return; const ms=Array.isArray(obj.material)?obj.material:[obj.material];
        ms.forEach(m=>{if(m.emissive && currentHighlight!=='status')m.emissiveIntensity=.55+.28*(.5+.5*Math.sin(t));});
      });
    }
    statusRing.scale.setScalar(1+.05*Math.sin(t*1.3));
    renderer.render(scene,camera);
  }

  renderStep(0,false);
  animate();
})();
