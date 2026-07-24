import subprocess
import sys

print("Starting Pinggy SSH tunnel...", flush=True)
try:
    process = subprocess.Popen(
        ['ssh', '-T', '-p', '443', '-o', 'StrictHostKeyChecking=no', '-R', '80:localhost:5173', 'a.pinggy.io'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    for line in iter(process.stdout.readline, ''):
        print(line, end='', flush=True)
except Exception as e:
    print(f"Error starting tunnel: {e}", flush=True)
    sys.exit(1)
