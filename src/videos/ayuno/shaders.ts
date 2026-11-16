import * as THREE from 'three';

/**
 * Materiales del vídeo médico. Todos son función del tiempo `uT` (segundos), así que cada
 * fotograma se puede renderizar por separado y sale idéntico.
 */

/** Ruido simplex 3D (Ashima Arts / Stefan Gustavson, licencia MIT) + fbm. */
export const GLSL_RUIDO = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm3(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*snoise(p); p*=2.03; a*=0.5; } return s; }
`;

export type OpcionesOrgano = {
  color: string;
  color2?: string;
  /** color de los vasos superficiales */
  vasos?: string;
  /** densidad del dibujo de vasos (0 = sin vasos) */
  vasosEsc?: number;
  /** escala del moteado */
  motas?: number;
  /** luz de borde (fresnel) */
  borde?: string;
  bordeInt?: number;
  /** ondulación orgánica de la superficie (unidades del objeto) */
  ondula?: number;
  /** pliegues estirados (rugosidad del estómago, estrías musculares) */
  pliegues?: number;
  /** dirección de las estrías (fibras musculares) */
  estrias?: number;
  rug?: number;
  barniz?: number;
  opacidad?: number;
  emisivo?: string;
};

/**
 * Tejido orgánico: color moteado, red de vasos superficiales, brillo húmedo (barniz),
 * luz de borde tipo transiluminación y ondulación lenta de la superficie.
 */
export const matOrgano = (o: OpcionesOrgano) => {
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color,
    roughness: o.rug ?? 0.42,
    clearcoat: o.barniz ?? 0.85,
    clearcoatRoughness: 0.18,
    sheen: 0.35,
    sheenColor: new THREE.Color(o.color2 ?? o.color).multiplyScalar(1.3),
    transparent: (o.opacidad ?? 1) < 1,
    opacity: o.opacidad ?? 1,
    depthWrite: (o.opacidad ?? 1) > 0.7,
    emissive: o.emisivo ?? '#000000',
  });
  const u = {
    uT: {value: 0},
    uColor2: {value: new THREE.Color(o.color2 ?? o.color)},
    uVasos: {value: new THREE.Color(o.vasos ?? '#5a0a14')},
    uVasosEsc: {value: o.vasosEsc ?? 0},
    uMotas: {value: o.motas ?? 3},
    uBorde: {value: new THREE.Color(o.borde ?? '#ff6a5a')},
    uBordeInt: {value: o.bordeInt ?? 0.8},
    uOndula: {value: o.ondula ?? 0},
    uPliegues: {value: o.pliegues ?? 0},
    uEstrias: {value: o.estrias ?? 0},
    uPulso: {value: 0},
    uAlerta: {value: 0},
  };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader =
      `uniform float uT; uniform float uOndula; varying vec3 vObj;\n${GLSL_RUIDO}\n` +
      s.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vObj = position;
         if (uOndula > 0.0) {
           float o = snoise(position * 2.2 + vec3(0.0, uT * 0.35, uT * 0.2));
           transformed += normal * o * uOndula;
         }`,
      );
    s.fragmentShader =
      `uniform float uT; uniform vec3 uColor2; uniform vec3 uVasos; uniform float uVasosEsc; uniform float uMotas;
       uniform vec3 uBorde; uniform float uBordeInt; uniform float uPliegues; uniform float uEstrias; uniform float uPulso; uniform float uAlerta;
       varying vec3 vObj;\n${GLSL_RUIDO}\n` +
      s.fragmentShader
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           float mot = fbm3(vObj * uMotas) * 0.5 + 0.5;
           diffuseColor.rgb = mix(diffuseColor.rgb, uColor2, smoothstep(0.25, 0.85, mot));
           if (uPliegues > 0.0) {
             float pl = 1.0 - abs(snoise(vec3(vObj.x * 1.2, vObj.y * uPliegues, vObj.z * 1.2)));
             diffuseColor.rgb *= 0.72 + 0.4 * pow(pl, 3.0);
           }
           if (uEstrias > 0.0) {
             float es = sin(vObj.y * uEstrias + snoise(vObj * 3.0) * 2.5);
             float fib = sin((vObj.x + vObj.z) * uEstrias * 2.6 + snoise(vObj * 8.0) * 1.5);
             diffuseColor.rgb *= 0.78 + 0.16 * es + 0.12 * fib;
           }
           float vaso = 0.0;
           if (uVasosEsc > 0.0) {
             float v1 = 1.0 - abs(snoise(vObj * uVasosEsc));
             float v2 = 1.0 - abs(snoise(vObj * uVasosEsc * 2.3 + 7.1));
             vaso = smoothstep(0.93, 0.995, v1) + smoothstep(0.95, 0.995, v2) * 0.6;
             diffuseColor.rgb = mix(diffuseColor.rgb, uVasos, clamp(vaso, 0.0, 1.0) * 0.85);
           }`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           float fr = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6);
           totalEmissiveRadiance += uBorde * fr * uBordeInt * (1.0 + uPulso * 0.8);
           totalEmissiveRadiance += uBorde * uPulso * 0.12;
           totalEmissiveRadiance += vec3(1.0, 0.08, 0.05) * uAlerta * (0.25 + fr);`,
        );
  };
  m.userData.u = u;
  return m;
};

/** Actualiza los uniformes de tiempo/pulso/alerta de un material de órgano. */
export const animarMat = (m: THREE.Material, t: number, pulso = 0, alerta = 0) => {
  const u = (m.userData as {u?: Record<string, {value: number}>}).u;
  if (!u) return;
  u.uT.value = t;
  u.uPulso.value = pulso;
  u.uAlerta.value = alerta;
};

/** Holograma médico (rayos X): borde luminoso, líneas de barrido y rejilla sutil. */
export const matHolograma = (color = '#3ab8ff', borde = '#9ae8ff') =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {uT: {value: 0}, uOp: {value: 1}, uColor: {value: new THREE.Color(color)}, uBorde: {value: new THREE.Color(borde)}},
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mv = viewMatrix * w; vV = -mv.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uT; uniform float uOp; uniform vec3 uColor; uniform vec3 uBorde;
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){
        float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float barrido = smoothstep(0.0, 0.02, fract(vW.y * 1.4 - uT * 0.25)) * (1.0 - smoothstep(0.02, 0.06, fract(vW.y * 1.4 - uT * 0.25)));
        float lineas = 0.5 + 0.5 * sin(vW.y * 420.0);
        vec3 c = uColor * (0.05 + 0.04 * lineas) + uBorde * fr * 0.85 + uBorde * barrido * 0.5;
        gl_FragColor = vec4(c * uOp, 1.0);
      }`,
  });

/** Piel realista (se desvanece para mostrar los órganos). */
export const matPiel = () =>
  new THREE.MeshPhysicalMaterial({
    color: '#c08a70',
    roughness: 0.6,
    sheen: 0.4,
    sheenColor: new THREE.Color('#ff9a80'),
    clearcoat: 0.08,
    transparent: true,
    opacity: 1,
  });

/**
 * Vaso sanguíneo con sangre que circula: pulsos brillantes que avanzan a lo largo del tubo
 * (coordenada uv.x) y transparencia en los bordes.
 */
export const matVaso = (color: string, brillo: string, velocidad = 0.6, op = 0.9) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {uT: {value: 0}, uColor: {value: new THREE.Color(color)}, uBrillo: {value: new THREE.Color(brillo)}, uVel: {value: velocidad}, uOp: {value: op}},
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uT; uniform vec3 uColor; uniform vec3 uBrillo; uniform float uVel; uniform float uOp;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.5);
        float flujo = pow(0.5 + 0.5 * sin((vUv.x * 60.0 - uT * uVel * 12.0)), 6.0);
        vec3 c = uColor * (0.55 + 0.45 * fr) + uBrillo * flujo * 0.9;
        gl_FragColor = vec4(c, uOp * (0.45 + 0.55 * fr));
      }`,
  });

/** Pared interior de un vaso o del estómago (vista desde dentro), húmeda y con vasos. */
export const matInterior = (color: string, color2: string, vasos: string) => {
  const m = matOrgano({color, color2, vasos, vasosEsc: 2.2, motas: 2, borde: color2, bordeInt: 0.35, rug: 0.35, barniz: 1});
  m.side = THREE.BackSide;
  return m;
};

/** Textura de punto suave para partículas y destellos. */
export const texPunto = (() => {
  let tx: THREE.Texture | null = null;
  return () => {
    if (tx) return tx;
    const S = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d')!;
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    tx = new THREE.CanvasTexture(cv);
    return tx;
  };
})();
