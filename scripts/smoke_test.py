"""Real HTTP flow, SQLite persistence and server restart. No external AI calls."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import httpx

ROOT = Path(__file__).resolve().parents[1]
URL = 'http://127.0.0.1:8123'
OWNER = {'X-Business-Key': 'smoke-test-workspace-key-0000000000000000'}


def start(database):
    process = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8123'],
        cwd=ROOT / 'backend', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        env={**os.environ, 'DATABASE_URL': f'sqlite:///{database}', 'OPENAI_API_KEY': '', 'NVIDIA_API_KEY': ''})
    for _ in range(100):
        try:
            if httpx.get(URL + '/api/health', trust_env=False, timeout=1).status_code == 200:
                return process
        except httpx.HTTPError:
            pass
        if process.poll() is not None:
            raise RuntimeError('Backend startup failed')
        time.sleep(.1)
    process.terminate()
    process.wait(timeout=5)
    raise RuntimeError('Backend startup timed out')


def stop(process):
    process.terminate()
    process.wait(timeout=5)


def main():
    with tempfile.TemporaryDirectory() as temp:
        database = Path(temp) / 'smoke.db'
        process = start(database)
        try:
            with httpx.Client(base_url=URL, headers=OWNER, trust_env=False) as client:
                r = client.post('/api/challenges', json={'title':'Smoke: отзывы', 'raw_description':'Отзывы обрабатываются вручную.', 'facts':{'problem':'Отзывы обрабатываются вручную.'}})
                assert r.status_code == 201, r.text
                cid = r.json()['id']
                assert r.json()['readiness_score'] == 15
                r = client.patch(f'/api/challenges/{cid}', json={'facts':{
                    'goal':'Ускорить анализ', 'target_users':'Учебный отдел', 'available_data':'5000 обезличенных отзывов CSV',
                    'expected_result':'Прототип дашборда', 'success_metrics':'F1 не ниже 0.8', 'constraints':'Без персональных данных', 'deadline':'30 ноября 2026'}})
                assert r.status_code == 200 and r.json()['readiness_score'] == 100
                assert client.post(f'/api/challenges/{cid}/publish').json()['status'] == 'PUBLISHED'
                assert len(client.get('/api/challenges').json()) == 1
                application = {'team_name':'Smoke team', 'members_count':3, 'skills':['Python'], 'github_url':'https://github.com/smoke-team', 'motivation':'Опыт анализа текстовых данных и создания веб-приложений.'}
                r = client.post(f'/api/challenges/{cid}/applications', json=application)
                assert r.status_code == 201, r.text
                aid = r.json()['id']
                assert client.patch(f'/api/applications/{aid}/select').json()['status'] == 'SELECTED'
            stop(process)
            process = start(database)
            with httpx.Client(base_url=URL, headers=OWNER, trust_env=False) as client:
                saved = client.get(f'/api/challenges/{cid}').json()
                assert saved['status'] == 'PUBLISHED'
                assert saved['score_history'] == [15, 100]
                assert client.get(f'/api/challenges/{cid}/applications').json()[0]['status'] == 'SELECTED'
            print('PASS: live HTTP create → clarify manually → publish → apply → select → server restart → persisted selection')
        finally:
            if process.poll() is None:
                stop(process)


if __name__ == '__main__':
    main()
