from PIL import Image, ImageEnhance
from pathlib import Path
root=Path(__file__).resolve().parents[1]
atlas=Image.open(root/'dist/equipment-atlas.png').convert('RGBA')
rocket=atlas.crop((0,0,atlas.width//3,atlas.height))
rocket=rocket.crop(rocket.getchannel('A').getbbox())
head=rocket.crop((190,0,407,338)); head=head.crop(head.getchannel('A').getbbox())
plume=rocket.crop((190,500,407,690)); plume=plume.crop(plume.getchannel('A').getbbox())
gray=ImageEnhance.Color(head).enhance(.14)
steel=Image.new('RGBA',gray.size,(164,171,160,0)); steel.putalpha(gray.getchannel('A'))
steel=Image.blend(gray,steel,.24); steel.putalpha(gray.getchannel('A'))
smoke=Image.new('RGBA',plume.size,(174,177,164,0)); smoke.putalpha(plume.getchannel('A').point(lambda v:round(v*.46)))
def fit(im,maxw,maxh):
 k=min(maxw/im.width,maxh/im.height)
 return im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.Resampling.LANCZOS)
def make(shell,shell_box,smoke_box):
 cell=Image.new('RGBA',(24,56))
 s=fit(shell,*shell_box); p=fit(smoke,*smoke_box)
 cell.alpha_composite(s,((24-s.width)//2,1))
 cell.alpha_composite(p,((24-p.width)//2,1+s.height-1))
 return cell
cow=make(head,(12,34),(12,21)); motor=make(steel,(9,29),(9,18))
out=Image.new('RGBA',(48,56));out.alpha_composite(cow,(0,0));out.alpha_composite(motor,(24,0))
out.save(root/'dist/cannon-projectiles135.png',optimize=True)
print(root/'dist/cannon-projectiles135.png')
