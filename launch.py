import subprocess
import sys
import os

# Démarre le backend Flask
backend_cmd = [sys.executable, 'run.py']
backend_proc = subprocess.Popen(backend_cmd, cwd=os.path.join(os.getcwd(), 'backend'))
print('Backend Flask lancé.')


# Démarre le frontend React (Windows : shell=True pour npm)
frontend_cwd = os.path.join(os.getcwd(), 'frontend')
if os.name == 'nt':
    frontend_proc = subprocess.Popen('npm start', cwd=frontend_cwd, shell=True)
else:
    frontend_proc = subprocess.Popen(['npm', 'start'], cwd=frontend_cwd)
print('Frontend React lancé.')

print('Les deux serveurs sont en cours d’exécution. Appuyez sur Ctrl+C pour arrêter.')

try:
    backend_proc.wait()
    frontend_proc.wait()
except KeyboardInterrupt:
    backend_proc.terminate()
    frontend_proc.terminate()
    print('Arrêt des serveurs.')
