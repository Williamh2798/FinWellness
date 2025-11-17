import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;

  float feed = base + (uDensity - 0.5) * 0.3;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = uRippleSpeed * t;
      float ring  = exp(-pow((r - waveR) / uRippleThickness, 2.0));
      float atten = exp(-t) * exp(-10.0 * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M = maskCircle(pixelUV, coverage);

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  gl_FragColor = vec4(uColor, M);
}
`;

const MAX_CLICKS = 10;

const PixelBlast = ({ variant = 'circle', pixelSize = 6, color = '#8BC9A3', patternScale = 3, patternDensity = 1.2, pixelSizeJitter = 0.5, enableRipples = true, rippleIntensityScale = 1.5, rippleThickness = 0.12, rippleSpeed = 0.4, speed = 0.6, edgeFade = 0.25 }) => {
  const containerRef = useRef(null);
  const threeRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (threeRef.current) {
      const t = threeRef.current;
      t.resizeObserver?.disconnect();
      cancelAnimationFrame(t.raf);
      t.quad?.geometry.dispose();
      t.material.dispose();
      t.renderer.dispose();
      if (t.renderer.domElement.parentElement === container) 
        container.removeChild(t.renderer.domElement);
      threeRef.current = null;
    }

    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);
    renderer.setClearAlpha(0);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uClickPos: { value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)) },
      uClickTimes: { value: new Float32Array(MAX_CLICKS) },
      uShapeType: { value: 1 },
      uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
      uScale: { value: patternScale },
      uDensity: { value: patternDensity },
      uPixelJitter: { value: pixelSizeJitter },
      uEnableRipples: { value: enableRipples ? 1 : 0 },
      uRippleSpeed: { value: rippleSpeed },
      uRippleThickness: { value: rippleThickness },
      uRippleIntensity: { value: rippleIntensityScale },
      uEdgeFade: { value: edgeFade }
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({ vertexShader: VERTEX_SRC, fragmentShader: FRAGMENT_SRC, uniforms, transparent: true, depthTest: false, depthWrite: false });
    const quadGeom = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(quadGeom, material);
    scene.add(quad);

    const clock = new THREE.Clock();
    const setSize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
      uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
    };
    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    const timeOffset = (window.crypto?.getRandomValues ? (() => { const u = new Uint32Array(1); window.crypto.getRandomValues(u); return u[0] / 0xffffffff; })() : Math.random()) * 1000;

    const onPointerDown = e => {
      const rect = renderer.domElement.getBoundingClientRect();
      const scaleX = renderer.domElement.width / rect.width;
      const scaleY = renderer.domElement.height / rect.height;
      const fx = (e.clientX - rect.left) * scaleX;
      const fy = (rect.height - (e.clientY - rect.top)) * scaleY;
      const ix = threeRef.current?.clickIx ?? 0;
      uniforms.uClickPos.value[ix].set(fx, fy);
      uniforms.uClickTimes.value[ix] = uniforms.uTime.value;
      if (threeRef.current) threeRef.current.clickIx = (ix + 1) % MAX_CLICKS;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });

    let raf = 0;
    const animate = () => {
      uniforms.uTime.value = timeOffset + clock.getElapsedTime() * speed;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    threeRef.current = { renderer, scene, camera, material, clock, clickIx: 0, uniforms, resizeObserver: ro, raf, quad, timeOffset };

    return () => {
      if (!threeRef.current) return;
      const t = threeRef.current;
      t.resizeObserver?.disconnect();
      cancelAnimationFrame(t.raf);
      t.quad?.geometry.dispose();
      t.material.dispose();
      t.renderer.dispose();
      if (t.renderer.domElement.parentElement === container) container.removeChild(t.renderer.domElement);
      threeRef.current = null;
    };
  }, [pixelSize, patternScale, patternDensity, enableRipples, rippleIntensityScale, rippleThickness, rippleSpeed, pixelSizeJitter, edgeFade, variant, color, speed]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
};

const GradientText = ({ children, colors = ['#40ffaa', '#4079ff', '#40ffaa', '#4079ff', '#40ffaa'], animationSpeed = 8 }) => {
  return (
    <>
      <style>{`@keyframes gradientShift { 0%, 100% { background-position: 0% center; } 50% { background-position: 100% center; }}`}</style>
      <span style={{ backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: `gradientShift ${animationSpeed}s ease infinite` }}>
        {children}
      </span>
    </>
  );
};

const TextType = ({ text, typingSpeed = 50, initialDelay = 0, pauseDuration = 2000, deletingSpeed = 30, loop = true, showCursor = true, cursorCharacter = '|', cursorBlinkDuration = 0.5, startOnVisible = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const [cursorOpacity, setCursorOpacity] = useState(1);
  const containerRef = useRef(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsVisible(true); }, { threshold: 0.1 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!showCursor) return;
    const interval = setInterval(() => { setCursorOpacity(prev => prev === 1 ? 0 : 1); }, cursorBlinkDuration * 1000);
    return () => clearInterval(interval);
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;
    let timeout;
    const currentText = textArray[currentTextIndex];

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) return;
          setCurrentTextIndex(prev => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => { setDisplayedText(prev => prev.slice(0, -1)); }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < currentText.length) {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev + currentText[currentCharIndex]);
            setCurrentCharIndex(prev => prev + 1);
          }, typingSpeed);
        } else if (textArray.length > 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => { setIsDeleting(true); }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [currentCharIndex, displayedText, isDeleting, typingSpeed, deletingSpeed, pauseDuration, textArray, currentTextIndex, loop, initialDelay, isVisible]);

  return (
    <span ref={containerRef} style={{ display: 'inline-block' }}>
      <span>{displayedText}</span>
      {showCursor && !isDeleting && currentCharIndex < textArray[currentTextIndex].length && (
        <span style={{ opacity: cursorOpacity, transition: 'opacity 0.1s' }}>{cursorCharacter}</span>
      )}
    </span>
  );
};

export default function TendLifeLanding() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0f0f23', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <PixelBlast variant="circle" pixelSize={6} color="#8BC9A3" patternScale={3} patternDensity={1.2} pixelSizeJitter={0.5} enableRipples rippleSpeed={0.4} rippleThickness={0.12} rippleIntensityScale={1.5} speed={0.6} edgeFade={0.25} />
      
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 40px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '80px', fontWeight: '800', margin: '0 0 32px 0', lineHeight: '1', letterSpacing: '-0.04em', textShadow: '0 2px 40px rgba(0, 0, 0, 0.5)' }}>
          <GradientText colors={['#40ffaa', '#4079ff', '#40ffaa', '#4079ff', '#40ffaa']} animationSpeed={6}>TendLife</GradientText>
        </h1>

        <h2 style={{ fontSize: '80px', fontWeight: '800', margin: '0 0 48px 0', lineHeight: '1', letterSpacing: '-0.04em', color: 'white', textShadow: '0 2px 40px rgba(0, 0, 0, 0.5)' }}>
          <TextType 
            text="Track. Plan. Thrive."
            typingSpeed={100}
            deletingSpeed={50}
            pauseDuration={3000}
            loop={true}
            showCursor={true}
            cursorCharacter="|"
            startOnVisible={true}
          />
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 48px 0', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '600px', fontWeight: '500' }}>
          Built for bartenders, servers, and hospitality workers who hustle hard and deserve financial peace of mind. Track your tips, manage irregular income, and finally get ahead.
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', padding: '24px 32px', backgroundColor: 'rgba(15, 15, 35, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(64, 255, 170, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(64, 255, 170, 0.1) inset', animation: 'glow 3s ease-in-out infinite' }}>
          <style>{`
            @keyframes glow { 0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(64, 255, 170, 0.1) inset, 0 0 20px rgba(64, 255, 170, 0.2); } 50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(64, 255, 170, 0.2) inset, 0 0 40px rgba(64, 255, 170, 0.4); }}
            @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }}
          `}</style>
          <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '10px', border: '2px solid rgba(64, 255, 170, 0.3)', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', outline: 'none', width: '300px', fontFamily: 'inherit', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }} onFocus={(e) => { e.target.style.borderColor = '#40ffaa'; e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.target.style.boxShadow = '0 4px 12px rgba(64, 255, 170, 0.3), 0 0 20px rgba(64, 255, 170, 0.2)'; }} onBlur={(e) => { e.target.style.borderColor = 'rgba(64, 255, 170, 0.3)'; e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; }} />
          <button onClick={handleSubmit} style={{ padding: '14px 32px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #40ffaa 0%, #4079ff 100%)', backgroundSize: '200% 200%', color: 'white', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(64, 255, 170, 0.4)', animation: 'shimmer 8s linear infinite' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px) scale(1.05)'; e.target.style.boxShadow = '0 6px 20px rgba(64, 255, 170, 0.6)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 4px 15px rgba(64, 255, 170, 0.4)'; }}>
            {submitted ? '✓ Joined!' : 'Join Waitlist'}
          </button>
        </div>

        {submitted && <p style={{ marginTop: '24px', color: '#8BC9A3', fontSize: '14px', fontWeight: '500' }}>Thanks for joining! We'll be in touch soon.</p>}
      </div>
    </div>
  );
}