"""Package the build staging as a verified, uncompressed Sites TAR.
Run npm run build first. Originals remain in dist for local development.
"""
from pathlib import Path
import tarfile,hashlib,json,sys,os
project=Path(__file__).resolve().parent.parent
root=project/'.sites-runtime/hosting-package'
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else project/'.sites-runtime/head-on-deploy.tar'
assert (root/'dist/server/index.js').is_file(), 'Run npm run build first'
manifest=json.loads((project/'.openai/hosting.json').read_text())
out.parent.mkdir(parents=True,exist_ok=True);temporary=out.with_suffix('.tmp')
with tarfile.open(temporary,'w',format=tarfile.USTAR_FORMAT) as archive:
    archive.add(root/'dist',arcname='dist')
with tarfile.open(temporary,'r:') as archive:
    members=[member for member in archive.getmembers() if member.isfile()]
    for member in members:
        actual=archive.extractfile(member).read();original=(root/member.name).read_bytes()
        assert hashlib.sha256(actual).digest()==hashlib.sha256(original).digest(), member.name
    assert json.loads(archive.extractfile('dist/.openai/hosting.json').read())['project_id']==manifest['project_id']
os.replace(temporary,out)
print(json.dumps({'archive':str(out),'files':len(members),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
