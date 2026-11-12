# The Devsign cover film: the Flow clip (a person at a desk with two monitors, both screens black, only the hands
# move) plus the prototype's real screens, frame by frame.
#   main monitor   <- a recording of Merge Studio (record-screen.cjs)
#   second monitor <- a still of the Code view (shot-code.cjs)
# Each screen is warped onto its corners (quads.json, from find-screens.py), lit like a panel, and tied into the
# photo: its light on the desk, keys and hands, a little lens glow, the person kept out of focus, and a dim on
# everything but the screens. The 8s clip plays forward then backward (16s, no jump); the screen recording eases
# back to its first frame at the end.
# usage: python -I compose.py <flow.mp4> <main screen.mp4> <second screen.png> <quads.json> <out dir>
#   env: DIMS=0.55          dim levels (one file each)
#        START=312          timeline frame the loop begins on (the finished screen, so the poster shows it)
#        GRAIN=0            film grain; 0 for the web files (grain multiplies the file size)
#        WEB=1 NAME=hero-en writes <NAME>.mp4 (1080p), <NAME>-720.mp4 and <NAME>-poster.png; CRF=21
#        FRAMES=0,120       stills of those frames only, for checking
import sys, os, subprocess, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter
from numpy.fft import rfft2, irfft2, fftfreq, rfftfreq
flow, screen, second_png, quads_json, outdir = sys.argv[1:6]
W,H=1920,1080; S=1.3; FW,FH=1280,720; SW,SH=1000,562
DESK_B,DESK_A,GLOW,SOFT=1.0,7.0,0.03,0.55
DIMS=[float(v) for v in os.environ.get('DIMS','0.4,0.55').split(',')]
START=int(os.environ.get('START','0'))            # the loop begins at this frame of the timeline (so the poster shows the finished screen)
GRAIN=float(os.environ.get('GRAIN','1'))          # film grain; 0 for the web files (grain multiplies the file size)
NAME=os.environ.get('NAME','hero-dual'); WEB=os.environ.get('WEB')
Qs=json.load(open(quads_json)); QA=[tuple(p) for p in Qs['main']]; QB=[tuple(p) for p in Qs['second']]
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def gauss(a,s):
    pad=int(3*s)+1; sq=a.ndim==2
    if sq: a=a[...,None]
    h0,w0=a.shape[:2]; b=np.pad(a,((pad,pad),(pad,pad),(0,0)),mode='edge'); hh,ww=b.shape[:2]
    fy=fftfreq(hh)[:,None]; fx=rfftfreq(ww)[None,:]; T=np.exp(-2*(np.pi*s)**2*(fx*fx+fy*fy)).astype(np.float32)
    out=np.empty_like(a)
    for c in range(a.shape[2]): out[...,c]=irfft2(rfft2(b[...,c])*T,s=(hh,ww))[pad:pad+h0,pad:pad+w0]
    return out[...,0] if sq else out
def coeffs(dst,src):
    A=[];B=[]
    for (x,y),(u,v) in zip(dst,src):
        A.append([x,y,1,0,0,0,-u*x,-u*y]); A.append([0,0,0,x,y,1,-v*x,-v*y]); B+= [u,v]
    return np.linalg.solve(np.array(A,float),np.array(B,float))
def g1(v,sg):
    n=int(3*sg); kx=np.exp(-0.5*(np.arange(-n,n+1)/sg)**2); kx/=kx.sum(); return np.convolve(np.pad(v,n,mode='edge'),kx,mode='valid').astype(np.float32)
lum_w=np.array([0.2126,0.7152,0.0722],np.float32)
def prep(Q,level):
    x0=int(min(p[0] for p in Q))-4; x1=int(max(p[0] for p in Q))+5; y0=int(min(p[1] for p in Q))-4; y1=int(max(p[1] for p in Q))+5
    sl=(slice(y0,y1),slice(x0,x1)); SSA=4
    poly=Image.new('L',(W*SSA,H*SSA),0); ImageDraw.Draw(poly).polygon([(x*SSA,y*SSA) for x,y in Q],fill=255)
    poly=np.asarray(poly.resize((W,H),Image.LANCZOS)).astype(np.float32)/255
    cu=coeffs(Q,[(0,0),(1,0),(1,1),(0,1)]); den=cu[6]*xx+cu[7]*yy+1
    U=(cu[0]*xx+cu[1]*yy+cu[2])/den; V=(cu[3]*xx+cu[4]*yy+cu[5])/den
    corner=(1-0.085*np.clip(((U-0.5)/0.5)**2+((V-0.5)/0.5)**2,0,2)/2)[sl]
    haze=(np.array([5,5,8],np.float32)+np.array([3.2,3.0,4.6],np.float32)*np.clip(1.15-U-0.6*V,0,1)[...,None])[sl]
    recess=(0.80+0.20*np.clip((gauss(poly,2.2*S)-0.5)*2.2,0,1))[sl]
    (x3,y3),(x2,y2)=Q[3],Q[2]; d=(yy-(y3+(y2-y3)*(xx-x3)/(x2-x3)))/S
    fall=np.clip((d-18)/55,0,1)*(0.6+0.4*np.exp(-((d-170)/130)**2))*np.exp(-np.clip(d-250,0,None)/150)
    # perspective coefficients for a warp straight into the bbox (output pixel -> source pixel of an SW x SH image)
    c=coeffs(Q,[(0,0),(SW,0),(SW,SH),(0,SH)]); k=c[6]*x0+c[7]*y0+1
    cb=(c[0]/k,c[1]/k,(c[0]*x0+c[1]*y0+c[2])/k,c[3]/k,c[4]/k,(c[3]*x0+c[4]*y0+c[5])/k,c[6]/k,c[7]/k)
    return dict(Q=Q,sl=sl,box=(x0,y0,x1,y1),poly=poly,polyc=poly[sl],corner=corner,haze=haze,recess=recess,fall=fall,cb=cb,level=level)
A=prep(QA,1.0); B=prep(QB,0.82)
def warp(s,img,soft):
    x0,y0,x1,y1=s['box']
    out=img.transform((x1-x0,y1-y0),Image.PERSPECTIVE,s['cb'],Image.BICUBIC).filter(ImageFilter.GaussianBlur(soft))
    return np.asarray(out).astype(np.float32)
def light(s,img,matte):
    lit=(s['haze']+img*0.95*s['level']*s['corner'][...,None])*s['recess'][...,None]
    lin=(img/255.0)**2.2*s['level']*matte[...,None]
    return lit,lin
allpoly=np.maximum(A['poly'],B['poly'])
mug=np.clip(np.clip(1-np.hypot((xx-485.7)/136.5,(yy-945.1)/123.5),0,1)/0.18,0,1)
deskmask=(1-0.85*mug)*(1-allpoly)
def desk(s,lin,matte,k):
    x0,y0,x1,y1=s['box']; msum=np.zeros(W,np.float32); lsum=np.zeros(W,np.float32)
    msum[x0:x1]=matte.sum(axis=0); lsum[x0:x1]=(lin@lum_w).sum(axis=0)
    cp=np.where(msum>20,lsum/np.maximum(msum,1),0).astype(np.float32); inx=(msum>20).astype(np.float32)
    cp1=g1(cp,60*S); in1=g1(inx,70*S); cp1=cp1/max(cp1.max(),1e-6); prof=0.45*in1+0.55*cp1
    mean=lin.sum(axis=(0,1))/max(matte.sum(),1); tint=mean/max(mean.max(),1e-6); tint=0.55+0.45*tint
    return prof*k,tint
def glow_of(s,lin):
    # lens glow from the screen's bright parts, computed at quarter size
    full=np.zeros((H,W,3),np.float32); full[s['sl']]=lin
    q=full.reshape(H//4,4,W//4,4,3).mean(axis=(1,3))
    g=0.50*gauss(q,3.0*S/4)+0.30*gauss(q,11*S/4)+0.20*gauss(q,38*S/4)
    return np.stack([np.asarray(Image.fromarray(g[...,c]).resize((W,H),Image.BILINEAR)) for c in range(3)],axis=-1)
# second screen: static
imgB=warp(B,Image.open(second_png).convert('RGB').resize((SW,SH),Image.LANCZOS),SOFT+0.25)
litB,linB=light(B,imgB,B['polyc']); profB,tintB=desk(B,linB,B['polyc'],0.7); glowB=glow_of(B,linB)
gB=profB[None,:]*B['fall']*deskmask
# lens blur on the person (right side); monitors stay sharp
amt=gauss(np.clip((xx-1475)/143,0,1),18*S)
mon=np.asarray(Image.fromarray((allpoly*255).astype('uint8')).filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(5*S))).astype(np.float32)/255
amt=amt*(1-mon); XL=int(np.argmax(amt.max(axis=0)>0.003)); amtc=amt[:,XL:,None]
r=8; kk=np.zeros((2*r+1,2*r+1),np.float32); Yk,Xk=np.mgrid[-r:r+1,-r:r+1]; kk[(Xk*Xk+Yk*Yk)<=r*r]=1; kk/=kk.sum(); FK=None
def lens(a):
    global FK
    pad=np.pad(a,((r,r),(r,r),(0,0)),mode='edge')
    if FK is None: K=np.zeros(pad.shape[:2],np.float32); K[:kk.shape[0],:kk.shape[1]]=kk; FK=rfft2(K)
    out=np.empty_like(a); h0,w0=a.shape[:2]
    for ch in range(3): out[...,ch]=irfft2(rfft2(pad[...,ch])*FK,s=pad.shape[:2])[2*r:2*r+h0,2*r:2*r+w0]
    return out
cx=(QA[0][0]+QA[2][0])/2; cy=(QA[0][1]+QA[2][1])/2
vigbase=np.clip((np.hypot((xx-cx)/(1250*S),(yy-cy)/(820*S))-0.55)/0.6,0,1)
# what can pass in front of the main screen: the shoulder, at its lower right corner
RX0,RX1,RY0,RY1=1230,A['box'][2],410,A['box'][3]
def occluder(frame_u8):
    reg=frame_u8[RY0:RY1,RX0:RX1].astype(np.float32)@np.array([0.299,0.587,0.114],np.float32)
    soft=np.clip((reg-3.0)/11.0,0,1)
    hard=Image.fromarray(((reg>8)*255).astype('uint8')).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(13)).filter(ImageFilter.GaussianBlur(1.2))
    return np.maximum(soft,np.asarray(hard).astype(np.float32)/255)
def dec(path,w,h,matrix='bt709'):
    return subprocess.Popen(['ffmpeg','-v','error','-i',path,'-vf',f'scale={w}:{h}:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix={matrix}:in_range=tv:out_range=pc','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
pf=dec(flow,FW,FH,'bt601')       # the Flow file is tagged smpte170m
raw=pf.stdout.read(); pf.wait(); F=np.frombuffer(raw,np.uint8).reshape(-1,FH,FW,3); NF=len(F)
order=list(range(NF))+list(range(NF-2,0,-1)); N=len(order); XF=12
fb=SW*SH*3
def screen_frames(sel):
    p=subprocess.Popen(['ffmpeg','-v','error','-i',screen,'-vf',f"select='{sel}',scale={SW}:{SH}:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt709:in_range=tv:out_range=pc",'-fps_mode','passthrough','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
    while True:
        b=p.stdout.read(fb)
        if len(b)<fb: break
        yield Image.frombuffer('RGB',(SW,SH),b,'raw','RGB',0,1)
    p.wait()
first=next(screen_frames('eq(n\\,0)'))
seg=screen_frames(f'gte(n\\,{START})')
only=[int(v) for v in os.environ['FRAMES'].split(',')] if os.environ.get('FRAMES') else None
os.makedirs(outdir,exist_ok=True)
enc=[]
def encoder(path,vf,crf):
    return subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','24','-i','-','-vf',vf+'scale=in_range=pc:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-crf',str(crf),'-preset','slower','-profile:v','high','-g','48','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-movflags','+faststart','-an',path],stdin=subprocess.PIPE)
if not only:
    for d in DIMS:
        if WEB: enc.append([encoder(os.path.join(outdir,f'{NAME}.mp4'),'',int(os.environ.get('CRF','23'))),encoder(os.path.join(outdir,f'{NAME}-720.mp4'),'scale=1280:720:flags=lanczos,',int(os.environ.get('CRF','23'))+1)])
        else: enc.append([encoder(os.path.join(outdir,f'{NAME}-dim{int(d*100)}.mp4'),'',17)])
rng=np.random.default_rng(7); last_img=first
x0,y0,x1,y1=A['box']
for i in range(N):
    t=(i+START)%N
    if t==0 and i>0: seg=screen_frames(f'lt(n\\,{START})')
    simg=next(seg,None) or last_img; last_img=simg
    if t>=N-XF: simg=Image.blend(simg,first,(t-(N-XF)+1)/XF)       # ease back to the first screen so the loop has no jump
    if only and i not in only: continue
    fr=np.asarray(Image.fromarray(F[order[t]]).resize((W,H),Image.LANCZOS))
    p=fr.astype(np.float32)
    matteA=A['polyc'].copy(); occ=occluder(fr); matteA[RY0-y0:RY1-y0,RX0-x0:RX1-x0]*=(1-occ)
    imgA=warp(A,simg,SOFT); litA,linA=light(A,imgA,matteA)
    c=p
    c[B['sl']]=c[B['sl']]*(1-B['polyc'][...,None])+litB*B['polyc'][...,None]
    c[A['sl']]=c[A['sl']]*(1-matteA[...,None])+litA*matteA[...,None]
    profA,tintA=desk(A,linA,matteA,1.0)
    gA=profA[None,:]*A['fall']*deskmask
    c=c*(1+DESK_B*(gA+gB))[...,None]+(gA[...,None]*tintA+gB[...,None]*tintB)*DESK_A
    glow=glow_of(A,linA)+glowB
    c=np.clip((np.clip(c,0,255)/255.0)**2.2+glow*GLOW,0,1)**(1/2.2)*255.0
    right=c[:,XL:]; c[:,XL:]=right*(1-amtc)+lens(right)*amtc
    g_=rng.normal(0,1,(H,W)).astype(np.float32); gp=np.pad(g_,1,mode='edge'); g_=(gp[1:-1,1:-1]*4+gp[:-2,1:-1]+gp[2:,1:-1]+gp[1:-1,:-2]+gp[1:-1,2:])/8*2.6*GRAIN
    keep=np.maximum(A['poly'],B['poly']*0.6); keep[A['sl']]=np.maximum(matteA,B['poly'][A['sl']]*0.6)
    for j,d in enumerate(DIMS):
        f=(1-d*(1-keep))*(1-0.10*min(d,0.45)/0.3*vigbase)
        o=np.clip(c*f[...,None]+g_[...,None],0,255).astype(np.uint8)
        if only: Image.fromarray(o).save(os.path.join(outdir,f'f{i:03d}-dim{int(d*100)}.jpg'),quality=92)
        else:
            if i==0: Image.fromarray(o).save(os.path.join(outdir,f'{NAME}-poster.png'))
            b_=o.tobytes()
            for e in enc[j]: e.stdin.write(b_)
    if i%24==0: print('frame',i,'/',N,flush=True)
for es in enc:
    for e in es: e.stdin.close(); e.wait()
print('done',N,'frames')
