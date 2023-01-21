import uio
import uos
import sys

import time


class Term(uio.IOBase):
    def __init__(self):
        super().__init__()
        # more stuff here
        # self.toread = 2
        self.buff = b""#testing\x03"
        self.boff = 0
        self.reads = 0
        self.writes = 0
        self.writel = []

    def readinto(self, buf):
        self.reads += 1
        if len(self.buff) - self.boff > 0:
            buf[:] = self.buff[self.boff:self.boff+len(buf)]
            self.boff += len(buf)
            return len(buf)
        else:
            return 0 # None - continue

    def write(self, buf):
        self.writes += 1
        self.writel.append(str(buf))
    
    def send_buffer(self, buff):
        self.buff = buff
        self.boff = 0
        uos.dupterm_notify(None)


def _reload_process(pname):
    if pname in sys.modules: # OR try delete
        del sys.modules[pname]
    
    time.sleep(0.1)
    print("Running module: {}".format(pname))
    __import__(pname)

def execute_term_cmd(command):
    t = Term()
    # Start duplication
    previous_stream = uos.dupterm(t, 0)
    t.send_buffer(command.encode("utf-8"))
    uos.dupterm_notify(None)
    print("Finished {} {} {}".format(t.reads, t.boff, t.buff))
    
    if previous_stream:
        uos.dupterm(previous_stream, 0)

def restart_process(pname):
    cmd = "\x03\012\015import weditor.pmanager;\012\015weditor.pmanager._reload_process('{}')\012\015\x03\x03"
    execute_term_cmd(cmd.format(pname))

def stop_process():
    execute_term_cmd("\x03\012\015\x03\012\015")
