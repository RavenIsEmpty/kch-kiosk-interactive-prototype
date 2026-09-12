import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const stage=document.querySelector('#stage'), loading=document.querySelector('#loading');
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xedf2f2);
const camera=new THREE.PerspectiveCamera(31,1,.01,20); camera.position.set(2.75,1.55,-3.55);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15; stage.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.07; controls.target.set(0,1.06,-.18); controls.minDistance=1.65; controls.maxDistance=5.5; controls.maxPolarAngle=Math.PI*.94;

const hemi=new THREE.HemisphereLight(0xffffff,0x7d8d8f,2.3); scene.add(hemi);
const key=new THREE.DirectionalLight(0xffffff,4.6); key.position.set(-3,5,-4); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.camera.left=-3; key.shadow.camera.right=3; key.shadow.camera.top=4; key.shadow.camera.bottom=-1; scene.add(key);
const fill=new THREE.DirectionalLight(0xd8ffff,2.1); fill.position.set(3,2,-2); scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,2.0); rim.position.set(1.5,4,4); scene.add(rim);
const soft=new THREE.PointLight(0xffffff,18,6,2); soft.position.set(-1.4,2.3,-1.7); scene.add(soft);

const floor=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshPhysicalMaterial({color:0xe7eded,roughness:.92})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const kiosk=new THREE.Group(); scene.add(kiosk);

const MAT={
 white:new THREE.MeshPhysicalMaterial({color:0xf4f3ef,roughness:.37,metalness:.02,clearcoat:.22,clearcoatRoughness:.55}),
 white2:new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.28,metalness:.01,clearcoat:.35}),
 teal:new THREE.MeshPhysicalMaterial({color:0x0a8385,roughness:.3,metalness:.18,clearcoat:.28}),
 tealDark:new THREE.MeshPhysicalMaterial({color:0x086a6e,roughness:.34,metalness:.14}),
 dark:new THREE.MeshStandardMaterial({color:0x171b1d,roughness:.64,metalness:.05}),
 charcoal:new THREE.MeshStandardMaterial({color:0x353a3d,roughness:.88}),
 metal:new THREE.MeshStandardMaterial({color:0x9ca6a7,roughness:.3,metalness:.7}),
 fabric:new THREE.MeshStandardMaterial({color:0x252a2e,roughness:.96}),
 glow:new THREE.MeshStandardMaterial({color:0x34dfd4,emissive:0x17a7a3,emissiveIntensity:2.2,roughness:.24})
};
const interactive=[];
function rb(name,w,h,d,x,y,z,mat=MAT.white,r=.025,segments=5){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,segments,Math.min(r,w/3,h/3,d/3)),mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;kiosk.add(m);return m}
function cyl(name,rt,rbm,h,seg,x,y,z,mat,rot=[0,0,0],open=false){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rbm,h,seg,1,open),mat);m.name=name;m.position.set(x,y,z);m.rotation.set(...rot);m.castShadow=true;kiosk.add(m);return m}
function torus(name,R,tube,x,y,z,mat,rot=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(new THREE.TorusGeometry(R,tube,20,72),mat);m.name=name;m.position.set(x,y,z);m.rotation.set(...rot);m.scale.set(...scale);m.castShadow=true;kiosk.add(m);return m}
function textureLabel(lines,bg='#0a8588',fg='white',w=256,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);x.textAlign='center';x.fillStyle=fg;let yy=h*.45;for(const [i,line] of lines.entries()){x.font=(i===0?'700 38px':'600 25px')+' system-ui';x.fillText(line,w/2,yy);yy+=42}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function screenTexture(step=0){const c=document.createElement('canvas');c.width=600;c.height=960;const g=c.getContext('2d');const teal='#07898c',ink='#0b4850';g.fillStyle='#ecffff';g.fillRect(0,0,c.width,c.height);const grad=g.createLinearGradient(0,0,0,960);grad.addColorStop(0,'#edffff');grad.addColorStop(1,'#d9f7f5');g.fillStyle=grad;g.fillRect(0,0,600,960);g.textAlign='center';g.fillStyle=teal;g.font='800 86px system-ui';g.fillText('KCH',300,150);g.fillStyle=ink;g.font='600 34px system-ui';const data=[['Welcome','Tap to Start'],['Height + Weight','Stand still on footprints'],['Height Sensor','Measuring…'],['Blood Pressure','Insert right arm into cuff'],['Optical Glucose','Place fingertip on sensor'],['Health Result','Low Risk · Complete']][step];g.font='800 41px system-ui';g.fillText(data[0],300,300);g.font='500 27px system-ui';g.fillText(data[1],300,352);if(step===5){g.fillStyle='#fff';g.strokeStyle='#11a6a2';g.lineWidth=4;for(let i=0;i<4;i++){const x=72+(i%2)*235,y=425+Math.floor(i/2)*145;g.beginPath();g.roundRect(x,y,215,112,18);g.fill();g.stroke()}g.fillStyle=ink;g.font='700 24px system-ui';g.fillText('168 cm',180,472);g.fillText('65 kg',415,472);g.fillText('118/78',180,617);g.fillText('5.6 mmol/L',415,617);g.fillStyle='#1aa566';g.font='800 34px system-ui';g.fillText('✓ LOW RISK',300,742)} else {g.fillStyle=teal;g.beginPath();g.roundRect(120,450,360,94,47);g.fill();g.fillStyle='white';g.font='800 33px system-ui';g.fillText(step===0?'TAP TO START':step===2?'MEASURING':'CONTINUE',300,510)}g.fillStyle='rgba(6,143,145,.11)';for(let i=0;i<5;i++){g.beginPath();g.arc(80+i*120,870,110-i*8,Math.PI,0);g.fill()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}

// platform - 620 x 540 x 55 mm with layered premium trim
rb('platformTeal',.62,.055,.54,0,.031,-.42,MAT.teal,.035,8);
rb('platformWhite',.59,.035,.51,0,.068,-.42,MAT.white2,.03,8);
rb('platformPad',.54,.017,.455,0,.093,-.43,MAT.charcoal,.022,8);
[-.135,.135].forEach(x=>rb('footGuide',.105,.008,.205,x,.106,-.43,MAT.metal,.04,8));
[-.26,.26].forEach(x=>[-.655,-.19].forEach(z=>cyl('rubberFoot',.025,.025,.015,24,x,.006,z,MAT.dark)));

// rear cabinet
rb('rearCabinet',.52,1.62,.36,0,0.88,0,MAT.white,.055,8);
rb('rearTopBand',.525,.095,.365,0,1.67,0,MAT.teal,.04,8);
rb('rightSpine',.075,1.69,.37,.223,.905,-.002,MAT.tealDark,.028,7);
// service seams/vent
rb('servicePanel',.30,.75,.008,0,.86,.184,MAT.white2,.026,6);
for(let i=0;i<5;i++) rb('rearVent',.013,.07,.012,-.12+i*.035,1.50,.187,MAT.dark,.004,3);

// sculpted front shell extrusion, true curved side silhouette
const shape=new THREE.Shape(); shape.moveTo(0,.25); shape.lineTo(0,1.62); shape.bezierCurveTo(.03,1.65,.10,1.66,.13,1.58); shape.bezierCurveTo(.17,1.43,.18,1.20,.17,1.05); shape.bezierCurveTo(.16,.83,.14,.58,.10,.34); shape.bezierCurveTo(.09,.29,.06,.25,0,.25); shape.closePath();
const shellGeo=new THREE.ExtrudeGeometry(shape,{depth:.455,bevelEnabled:true,bevelThickness:.012,bevelSize:.014,bevelSegments:5,curveSegments:16,steps:1}); shellGeo.computeVertexNormals();
const shell=new THREE.Mesh(shellGeo,MAT.white);shell.name='frontShell';shell.rotation.y=Math.PI/2;shell.position.set(-.228,0,-.182);shell.castShadow=true;shell.receiveShadow=true;kiosk.add(shell);
// teal under-spine visible below shell
rb('frontLowerSpine',.46,.19,.10,0,.19,-.205,MAT.teal,.032,7);

// display pod: top toward body (+z), bottom toward user (-z)
const screenPivot=new THREE.Group(); screenPivot.name='screenAssembly'; screenPivot.position.set(-.02,1.18,-.35);screenPivot.rotation.x=THREE.MathUtils.degToRad(10);kiosk.add(screenPivot);
const bezel=new THREE.Mesh(new RoundedBoxGeometry(.39,.64,.045,7,.026),MAT.white2);bezel.castShadow=true;screenPivot.add(bezel);
const blackInset=new THREE.Mesh(new RoundedBoxGeometry(.335,.535,.022,6,.019),MAT.dark);blackInset.position.z=-.031;screenPivot.add(blackInset);
const scrMat=new THREE.MeshBasicMaterial({map:screenTexture(0)});const scr=new THREE.Mesh(new THREE.PlaneGeometry(.305,.485),scrMat);scr.name='screen';scr.position.z=-.043;screenPivot.add(scr);
// camera + top speaker grilles on display
rb('cameraBar',.10,.026,.014,-.02,1.49,-.405,MAT.dark,.012,5);
for(const sx of [-.15,.11]) for(let ix=0;ix<4;ix++) for(let iy=0;iy<2;iy++){const dot=cyl('speakerDot',.004,.004,.005,10,sx+ix*.014,1.49+iy*.013,-.409,MAT.dark,[Math.PI/2,0,0]);}

// status ring, QR & printer
const ring=torus('statusRing',.048,.010,-.055,.83,-.383,MAT.glow); interactive.push(ring);
rb('qrSlot',.092,.035,.018,.075,.855,-.388,MAT.dark,.008,4);rb('receiptSlot',.105,.027,.018,.075,.805,-.388,MAT.dark,.007,4);
// lower speaker grille
for(let ix=0;ix<5;ix++) for(let iy=0;iy<5;iy++){const dx=(ix-2)*.013,dy=(iy-2)*.013;if(dx*dx+dy*dy<.0014)cyl('speakerDot',.0038,.0038,.005,10,-.155+dx,.83+dy,-.389,MAT.dark,[Math.PI/2,0,0])}

// mast
rb('mastWhite',.11,.57,.11,0,1.89,.12,MAT.white2,.025,7);
rb('mastTeal',.045,.55,.016,0,1.89,.058,MAT.teal,.008,4);
// curved overhead height arm, 580mm concept reach aligned to platform midpoint
const armCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,2.055,.12),new THREE.Vector3(0,2.06,-.05),new THREE.Vector3(0,2.025,-.26),new THREE.Vector3(0,1.995,-.42)]);
const arm=new THREE.Mesh(new THREE.TubeGeometry(armCurve,48,.047,16,false),MAT.white2);arm.name='heightArm';arm.castShadow=true;kiosk.add(arm);interactive.push(arm);
const accentCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.001,2.095,.10),new THREE.Vector3(.001,2.095,-.07),new THREE.Vector3(.001,2.055,-.27),new THREE.Vector3(.001,2.025,-.405)]);
const accent=new THREE.Mesh(new THREE.TubeGeometry(accentCurve,42,.010,10,false),MAT.teal);kiosk.add(accent);
cyl('heightSensorHousing',.052,.052,.052,36,0,1.965,-.425,MAT.dark,[Math.PI/2,0,0]);cyl('heightSensorLens',.029,.029,.008,32,0,1.936,-.425,MAT.glow,[Math.PI/2,0,0]);
const beamMat=new THREE.MeshBasicMaterial({color:0x22d5cf,transparent:true,opacity:.22,depthWrite:false});const beam=new THREE.Mesh(new THREE.CylinderGeometry(.007,.022,1.86,18,1,true),beamMat);beam.name='heightBeam';beam.position.set(0,1.02,-.425);beam.visible=false;kiosk.add(beam);

// BP shelf + cuff on USER RIGHT (world +X), opening toward user/front (-Z)
rb('bpSupport',.13,.30,.12,.315,1.05,-.03,MAT.white2,.026,6);
rb('bpShelf',.31,.035,.27,.38,1.045,-.245,MAT.white2,.024,7);rb('bpShelfTrim',.31,.014,.27,.38,1.068,-.245,MAT.teal,.012,5);
const cuffOuter=cyl('bpCuff',.102,.102,.15,48,.39,1.13,-.365,MAT.fabric,[Math.PI/2,0,0],true);cuffOuter.scale.set(1.05,.82,1);interactive.push(cuffOuter);
torus('cuffTrim',.101,.012,.39,1.13,-.445,MAT.metal,[0,0,0],[1.05,.82,1]);
rb('cuffCradle',.235,.095,.14,.39,1.075,-.29,MAT.white2,.035,8);
// glucose sensor below/inward, upward-facing pad
const glu=rb('glucoseSensor',.105,.13,.08,.31,.94,-.30,MAT.white2,.025,7);glu.rotation.x=-.25;interactive.push(glu);
const glowPad=rb('glucosePad',.068,.046,.012,.31,.958,-.346,MAT.glow,.014,6);glowPad.rotation.x=-.25;
// managed BP hose
const hoseCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.42,1.08,-.43),new THREE.Vector3(.48,.94,-.45),new THREE.Vector3(.42,.78,-.35),new THREE.Vector3(.32,.86,-.27)]);const hose=new THREE.Mesh(new THREE.TubeGeometry(hoseCurve,48,.010,12,false),MAT.dark);hose.castShadow=true;kiosk.add(hose);

// side icon panels, matching approved render visual language
const sideLabels=[['HEIGHT',''],['WEIGHT',''],['GLUCOSE',''],['BLOOD','PRESSURE']];sideLabels.forEach((lines,i)=>{const tex=textureLabel(lines);const mat=new THREE.MeshBasicMaterial({map:tex});const p=new THREE.Mesh(new RoundedBoxGeometry(.012,.13,.13,5,.018),mat);p.position.set(.267,1.48-i*.155,-.055);p.rotation.y=0;p.castShadow=false;kiosk.add(p)});

// small KCH mark on lower spine
const logoTex=textureLabel([['KCH','']], '#0a8385','white',400,130);const logoMat=new THREE.MeshBasicMaterial({map:logoTex,transparent:false});const logo=new THREE.Mesh(new THREE.PlaneGeometry(.20,.065),logoMat);logo.position.set(0,.20,-.261);kiosk.add(logo);

function resize(){const r=stage.getBoundingClientRect();camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false)};new ResizeObserver(resize).observe(stage);resize(); loading.classList.add('hide');
const views={hero:[2.8,1.55,-3.4],front:[0,1.43,-3.45],right:[3.55,1.38,-.18],back:[0,1.42,3.45]};
let tween=null;function goView(name,duration=650){const v=views[name]||views.hero;const start=camera.position.clone(),end=new THREE.Vector3(...v),startT=performance.now();tween={start,end,startT,duration,target:new THREE.Vector3(0,1.06,-.18)};document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name))}
function focus(pos,target,duration=650){const start=camera.position.clone(),end=new THREE.Vector3(...pos),startT=performance.now();tween={start,end,startT,duration,target:new THREE.Vector3(...target)}}

document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>goView(b.dataset.view)));
document.querySelector('#resetBtn').addEventListener('click',()=>goView('hero'));document.querySelector('#refBtn').addEventListener('click',()=>document.querySelector('#refbox').classList.toggle('show'));
let auto=false;document.querySelector('#autoBtn').addEventListener('click',e=>{auto=!auto;controls.autoRotate=auto;controls.autoRotateSpeed=1.1;e.currentTarget.classList.toggle('active',auto)});

const steps=[
 {title:'Welcome & Login',copy:'Tap the touchscreen. Enter a phone number, scan QR, or continue as a guest.',view:[1.7,1.40,-2.2],target:[0,1.22,-.34],screen:0},
 {title:'Height & Weight',copy:'Stand naturally on both foot guides. Keep your feet still while the platform measures weight.',view:[1.7,1.14,-2.35],target:[0,.42,-.42],screen:1,beam:true},
 {title:'Height Sensor',copy:'Stand straight. The overhead sensor measures vertically through the center of your standing position.',view:[1.85,1.72,-2.55],target:[0,1.88,-.40],screen:2,beam:true,part:arm},
 {title:'Blood Pressure',copy:'Insert your right arm into the cuff and rest your forearm on the support shelf.',view:[2.2,1.32,-2.05],target:[.38,1.10,-.34],screen:3,part:cuffOuter},
 {title:'Optical Glucose',copy:'Remove your arm from the cuff, then place a fingertip gently on the optical sensor.',view:[2.0,1.18,-1.9],target:[.31,.95,-.32],screen:4,part:glu},
 {title:'AI Result + QR / Print',copy:'Review your measurements, risk level and recommendation. Scan QR or print a receipt.',view:[1.65,1.35,-2.15],target:[0,1.15,-.34],screen:5,part:ring}
];
let step=0, demoTimer=null, activePart=null;const stepTitle=document.querySelector('#stepTitle'),stepCopy=document.querySelector('#stepCopy'),stepNo=document.querySelector('#stepNo'),bar=document.querySelector('#progressBar');
function setHighlight(part){if(activePart?.material?.emissive){activePart.material.emissive.setHex(activePart.userData.oldEm||0);activePart.material.emissiveIntensity=activePart.userData.oldEi||0}activePart=part||null;if(activePart?.material){if(!activePart.material.emissive)activePart.material.emissive=new THREE.Color(0x000000);activePart.userData.oldEm=activePart.material.emissive.getHex();activePart.userData.oldEi=activePart.material.emissiveIntensity||0;activePart.material.emissive.setHex(0x0cc7c1);activePart.material.emissiveIntensity=1.1}}
function setStep(i){step=(i+steps.length)%steps.length;const s=steps[step];stepTitle.textContent=s.title;stepCopy.textContent=s.copy;stepNo.textContent=`${step+1} / ${steps.length}`;bar.style.width=`${((step+1)/steps.length)*100}%`;scrMat.map.dispose();scrMat.map=screenTexture(s.screen);scrMat.needsUpdate=true;beam.visible=!!s.beam;setHighlight(s.part);focus(s.view,s.target)}
document.querySelector('#nextBtn').addEventListener('click',()=>{clearTimeout(demoTimer);setStep(step+1)});document.querySelector('#prevBtn').addEventListener('click',()=>{clearTimeout(demoTimer);setStep(step-1)});
document.querySelector('#startDemo').addEventListener('click',()=>{clearTimeout(demoTimer);step=0;setStep(0);const advance=()=>{if(step<steps.length-1){demoTimer=setTimeout(()=>{setStep(step+1);advance()},3200)}};advance()});

const clock=new THREE.Clock();function animate(now){requestAnimationFrame(animate);if(tween){const p=Math.min(1,(now-tween.startT)/tween.duration),e=1-Math.pow(1-p,3);camera.position.lerpVectors(tween.start,tween.end,e);controls.target.lerp(tween.target,.13);if(p>=1)tween=null}controls.update();if(activePart){const pulse=.65+.35*Math.sin(clock.getElapsedTime()*5);if(activePart.material?.emissive)activePart.material.emissiveIntensity=.65+pulse*.8}renderer.render(scene,camera)}animate(performance.now());setStep(0);
