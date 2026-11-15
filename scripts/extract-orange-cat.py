#!/usr/bin/env python3
"""Cut the approved LibTV originals into aligned, binary-alpha PNG layers."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage as ndi

keys={'base':('0qGd0s6oLw',1,1),'ear':('laMf0qvTWO',2,2),'mouth':('zHNvuKiREe',2,2),'face':('pSkshRYRg2',2,2),'prop':('BWM90fCNDx',3,2),'type':('GUPQBwJ6hf',4,2)}
def clean(im):
 a=np.asarray(im.convert('RGB'))
 # Checkerboard is neutral; preserve internal white details enclosed by the sprite.
 chroma=a.max(axis=2).astype(int)-a.min(axis=2)
 core=(chroma>23)|(a.max(axis=2)<170)
 ids,n=ndi.label(core)
 counts=np.bincount(ids.ravel()); counts[0]=0
 core=ids==counts.argmax()
 mask=ndi.binary_fill_holes(core)
 # Remove neutral fringe from the outside only. Internal white pixels are artwork.
 edge=mask&~ndi.binary_erosion(mask,iterations=8)
 mask &= ~(edge&(chroma<19)&(a.max(axis=2)>170))
 return Image.fromarray(np.dstack((np.where(mask[:,:,None],a,0),mask.astype('uint8')*255)))
def parts(source, key):
 node,cols,rows=keys[key]
 im=Image.open(source/f'i-{node}-0.png')
 for j in range(rows):
  for i in range(cols):
   w,h=im.size
   row=im.crop((0,h*j//rows,w,h*(j+1)//rows))
   if key in ('mouth','face') and j:
    if i: continue
    cut=row.crop((w//4,0,w*3//4,row.height))
   else: cut=row.crop((w*i//cols,0,w*(i+1)//cols,row.height))
   full=clean(cut)
   yield full.crop(full.getbbox())
def scaled(im,h):
 im=im.resize((round(im.width*h/im.height),h),Image.Resampling.NEAREST)
 return im
def centered(im,h):
 im=scaled(im,h)
 out=Image.new("RGBA",(320,320));out.paste(im,((320-im.width)//2,20));return out
def eye(im):
 a=np.asarray(im); r,g,b,v=np.moveaxis(a,-1,0); h,w=r.shape
 sel=(v>0)&(r<120)&(g<85)&(b<70)
 sel[:round(h*.18),:]=False; sel[round(h*.53):,:]=False
 ids,n=ndi.label(sel)
 cand=[]
 for i,sl in enumerate(ndi.find_objects(ids),1):
  if not sl: continue
  yy,xx=sl; dy=yy.stop-yy.start; dx=xx.stop-xx.start
  if min(dx,dy)<6 or max(dx,dy)>min(dx,dy)*1.7: continue
  area=np.count_nonzero(ids[sl]==i)
  if area<dx*dy*.55: continue
  cand.append((area,(xx.start+xx.stop)/2,(yy.start+yy.stop)/2,dx,dy))
 return sorted(sorted(cand,reverse=True)[:2],key=lambda x:x[1])

import sys
if len(sys.argv) != 3:
    sys.exit('usage: python scripts/extract-orange-cat.py ORIGINALS_DIR OUTPUT_DIR')
SOURCE,OUT=map(Path,sys.argv[1:])
OUT.mkdir(parents=True,exist_ok=True)
S=(320,320)
def blank():return Image.new('RGBA',S)
def sel(im,mask):
 a=np.array(im);a[:,:,3]*=mask.astype(np.uint8);a[a[:,:,3]==0]=0
 return Image.fromarray(a)
def maskpoly(points):
 m=Image.new('L',S);ImageDraw.Draw(m).polygon(points,fill=255)
 return np.asarray(m)>0
def save(im,name):
 im.save(OUT/(name+'.png'),optimize=True)
y,x=np.indices((320,320))
sprites={k:[centered(im,266) for im in parts(SOURCE,k)] for k in keys}
base=sprites['base'][0]
def register(im):
 src=eye(im);ref=eye(base)
 sx=(src[1][1]-src[0][1])/(ref[1][1]-ref[0][1])
 sy=sx
 dx=np.mean([s[1]-r[1]*sx for s,r in zip(src,ref)])
 dy=np.mean([s[2]-r[2]*sy for s,r in zip(src,ref)])
 return im.transform(S,Image.Transform.AFFINE,(sx,0,dx,0,sy,dy),resample=Image.Resampling.NEAREST)
def rgb(im):
 return np.moveaxis(np.asarray(im).astype(int),-1,0)
def box(l,t,r,b):return (x>=l)&(x<r)&(y>=t)&(y<b)
headrow=176
save(sel(base,y>=headrow),'CAT_body')
ear_zone=(y<93)|((y<107)&((x<85)|(x>217)))
upright=sel(base,ear_zone)
save(upright,'CAT_ear_upright')
save(sel(base,(y<headrow)&~ear_zone),'CAT_head_base')
for i,im in enumerate(sprites['ear'],1):
 save(sel(register(im),ear_zone),f'CAT_ear_CE{i:02}')
for i,im in enumerate(sprites['mouth'],2):
 save(sel(register(im),box(125,120,178,149)),f'CAT_muzzle_CN{i:02}')
for id,im in zip(('P01','P02','P06'),sprites['face']):
 im=register(im);r,g,b,a=rgb(im)
 # Keep only the pale markings, outside the baseline white eye rings.
 pale=(r>222)&(g>200)&(b>170)&(a>0)
 region=(box(138,39,166,125)|box(93,79,129,100)|box(174,79,209,100)|box(62,128,97,159)|box(208,128,241,159))
 if id=='P01':region &=box(138,39,166,125)
 if id=='P02':region &=~box(138,39,166,125)
 save(sel(im,pale&region),f'CAT_face_{id}')
r,g,b,a=rgb(base)
pup=(a>0)&(r<125)&(g<89)&(b<75)&(box(93,100,128,136)|box(175,100,209,136))
save(sel(base,pup),'CAT_iris')
# Keep the pigment and adjacent outline of each real accessory, not the donor head.
clip=[(48,5,153,105),(36,0,289,109),(175,45,236,100),(42,155,256,255),(53,152,250,268),(39,0,267,107)]
for i,im in enumerate(sprites['prop']):
 im=register(im);r,g,b,a=rgb(im)
 if i in (1,5): fill=(b>r+11)&(b>g+4)
 elif i==2: fill=(r>170)&(g>140)&(g>b+30)&(r-g<70)&(b<214)
 else: fill=(r>g+29)&(b>g-9)&(r>b+25)&(g<164)
 window=box(*clip[i]); colored=fill&window&(a>0)
 ids,n=ndi.label(colored);sizes=np.bincount(ids.ravel());sizes[0]=0
 colored=(sizes[ids]>10)
 dark=(r<125)&(g<100)&(b<96)
 around=ndi.binary_dilation(colored,iterations=4)
 shape=(colored|(around&dark))&window
 shape=ndi.binary_fill_holes(shape)
 if i==2:
  shape = maskpoly([(178,61),(196,60),(205,49),(211,49),(220,62),(231,65),(231,71),(222,77),(223,95),(210,88),(202,87),(193,92),(185,92),(187,76),(177,68)])
 save(sel(im,shape),f'CAT_accessory_A{i+1:02}')
# Lock the head and laptop to the first frame; only copy the chest/paw area from other frames.
frames=sprites['type']
rest=frames[0]
for i,frame in enumerate(frames):
 out=blank()
 # This cut runs behind the jaw; raised paws are composited in a separate front layer.
 torso=maskpoly([(77,163),(93,151),(206,151),(221,166),(231,202),(227,214),(74,214)])
 propLimit=np.where(x<104,207,np.where(x<210,211,210))
 moving=(y<propLimit)&torso& (np.array(frame)[:,:,3]>0)
 fixed=(y>=propLimit)|((x>=224)&(y>=167))
 out.alpha_composite(sel(rest,fixed))
 out.alpha_composite(sel(frame,moving&~fixed))
 mode='gentle' if i<4 else 'fast'
 save(out,f'CAT_typing_{mode}_{i%4}')
 if i in (4,5,6):
  coords={
   4:[(73,146),(76,135),(84,129),(98,130),(108,142),(115,161),(133,203),(124,210),(88,210),(77,180)],
   5:[(175,197),(178,160),(190,145),(209,145),(220,158),(217,188),(204,206)],
   6:[(82,145),(85,133),(94,126),(106,126),(115,133),(120,147),(124,165),(148,208),(141,211),(91,211),(78,185)],
  }
  area=maskpoly(coords[i])
  if i==6: area |=maskpoly([(164,209),(178,183),(189,150),(196,132),(204,127),(215,127),(225,136),(232,148),(231,167),(226,185),(214,210)])
  save(sel(frame,area&(y<propLimit)),f'CAT_typing_front_{i%4}')
