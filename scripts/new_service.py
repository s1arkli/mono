import os
import sys
from pathlib import Path
from template import main_tpl,root_tpl,rpc_tpl,dal_tpl,logo_tpl

module = sys.argv[1]
base = f"service/{module}"

dirs = [
    f"{base}/cmd",
    f"{base}/internal/client",
    f"{base}/internal/infra",
    f"{base}/internal/interfaces",
    f"{base}/pkg",
    f"gateway/{module}"
]

for d in dirs:
    os.makedirs(d,exist_ok=True)

files = {
    f"{base}/main.go" : main_tpl.substitute(module=module),
    f"{base}/cmd/root.go":root_tpl.substitute(module=module),
    f"{base}/cmd/dal.go": dal_tpl.substitute(module=module),
    f"{base}/cmd/{module}.go": rpc_tpl.substitute(module=module),
    f"{base}/pkg/logo.go":logo_tpl.substitute(module=module),
}

for path,content in files.items():
    p = Path(path)
    if p.exists():
        continue
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)