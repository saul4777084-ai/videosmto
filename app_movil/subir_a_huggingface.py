"""Lo ejecuta GitHub Actions: crea (o actualiza) tu Space privado de Hugging Face con esta carpeta."""
import os
import sys

from huggingface_hub import HfApi

token = os.environ.get('HF_TOKEN')
if not token:
    sys.exit('Falta el secreto HF_TOKEN en GitHub (Settings → Secrets and variables → Actions). '
             'Créalo con un token de escritura de https://huggingface.co/settings/tokens y vuelve a lanzar este trabajo.')
api = HfApi(token=token)
usuario = api.whoami()['name']
repo = os.environ.get('HF_SPACE') or f'{usuario}/resumenes-peliculas'

api.create_repo(repo, repo_type='space', space_sdk='gradio', private=True, exist_ok=True)
for clave in ('ANTHROPIC_API_KEY', 'APP_CLAVE'):
    if os.environ.get(clave):
        api.add_space_secret(repo, clave, os.environ[clave])
        print(f'Secreto {clave} guardado en el Space.')
if not os.environ.get('ANTHROPIC_API_KEY'):
    print('Aviso: falta el secreto ANTHROPIC_API_KEY; la app no podrá escribir guiones hasta que lo añadas.')

carpeta = os.path.dirname(os.path.abspath(__file__))
api.upload_folder(repo_id=repo, repo_type='space', folder_path=carpeta, commit_message='Actualiza la app desde GitHub',
                  ignore_patterns=['trabajos/**', 'voces/**', '__pycache__/**', '.gitignore', 'subir_a_huggingface.py'])
print(f'\nListo. Abre tu app en el móvil:  https://huggingface.co/spaces/{repo}')
