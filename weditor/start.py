import os
import json
import sys
from microWebSrv import MicroWebSrv

blacklisted_elements = ["/webrepl_cfg.py"]
DEBUG_PRINT = False

def dprint(string):
    if not DEBUG_PRINT:
        return
    print("[--WEB DEBUG {}--]".format(string))

def _respond(httpResponse, content):
    httpResponse.WriteResponseOk(
        headers = {}, #"Access-Control-Allow-Origin": "*"
        contentType = "application/json",
        contentCharset = "UTF-8",
        content = json.dumps(content)
    )

@MicroWebSrv.route('/dir')
def get_dir(httpClient, httpResponse):
    args = httpClient.GetRequestQueryParams()
    path = args.get('path', '/')
    if path != "/" and path[-1] == "/":
        path = path[:len(path)-1]
    dprint("Listing dir {}".format(path))
    elements = list(os.ilistdir(path))
    files = []
    dirs = []
    for pt in elements:
        to_check  = f"/{pt[0]}" if path == "/" else f"{path}/{pt[0]}"
        if to_check not in blacklisted_elements :
               if pt[1]==32768:
                   files.append(pt[0])
               if pt[1]==16384:
                   dirs.append(pt[0])
    content = {"files": files, "dirs": dirs}
    
    _respond(httpResponse, content)

@MicroWebSrv.route('/file')
def get_file(httpClient, httpResponse):
    args = httpClient.GetRequestQueryParams()
    path = args.get('path', None)
    content = {}
    if path:
        dprint("Loading file {}".format(path))
        with open(path, 'r') as f:
            content = {"lines": "".join([l for l in f])}

    _respond(httpResponse, content)

@MicroWebSrv.route('/savefile', 'OPTIONS')
def save_file_OPTIONS(httpClient, httpResponse):
    dprint("received savefile OPTIONS request")
    httpResponse.WriteResponseOk(
        headers = {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Methods": "OPTIONS, POST", 
            "Access-Control-Allow-Headers": "content-type"
        },
        contentType = "application/json",
        contentCharset = "UTF-8",
        content = ""
    )

@MicroWebSrv.route('/savefile', 'POST')
def save_file(httpClient, httpResponse):
    data = httpClient.ReadRequestContentAsJSON()
    fpath = data.get('path', None)
    if fpath:
        dprint("Got save file request for: {}".format(fpath))
        content = {"error": True}
        with open(fpath, "w") as f:
            f.write(data["lines"])
            content = {"saved": True}

    _respond(httpResponse, content)

@MicroWebSrv.route('/newfile')
def new_file(httpClient, httpResponse):
    args = httpClient.GetRequestQueryParams()
    path = args.get('path', None)
    content = {"created": False}
    if path:
        dprint("Creating new file {}".format(path))
        with open(path, 'a') as f:
            content = {"created": True}

    _respond(httpResponse, content)

mws = MicroWebSrv(webPath="/weditor")

def start_debug():
    dprint("STARTING WEB SERVER")
    try:
        mws.Start(threaded=False)
    except KeyboardInterrupt:
        pass
    finally:
        dprint("STOPPING WEB SERVER")
        mws.Stop()
        mws._server.close()
        del sys.modules['microWebSrv']

def start():
    mws.Start(threaded=True)

start()

