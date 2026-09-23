from app.schemas import Analysis, Question
from app.services import openai_service


def create(client, owner, facts=None):
    return client.post('/api/challenges', headers=owner, json={'title':'Отзывы студентов', 'raw_description':'Хотим анализировать отзывы студентов.', 'facts':facts or {}})


def test_complete_flow(client, owner, facts):
    response = create(client, owner, {'problem':facts['problem']})
    assert response.status_code == 201, response.text
    c = response.json(); cid=c['id']
    assert c['readiness_score'] == 15
    assert len(c['questions']) == 3
    assert 'owner_hash' not in c
    assert client.get('/api/challenges').json() == []
    assert client.get('/api/challenges?scope=mine', headers=owner).json()[0]['id'] == cid
    assert client.post(f'/api/challenges/{cid}/publish',headers=owner).status_code == 409
    updated=client.patch(f'/api/challenges/{cid}',headers=owner,json={'facts':facts})
    assert updated.status_code == 200, updated.text
    assert updated.json()['score_history'] == [15,100]
    assert client.post(f'/api/challenges/{cid}/publish',headers=owner).json()['status'] == 'PUBLISHED'
    assert len(client.get('/api/challenges').json()) == 1
    assert client.get(f'/api/challenges/{cid}').status_code == 200
    payload={'team_name':'Qadam AI','members_count':3,'skills':['Python','NLP'],'github_url':'https://github.com/qadam','motivation':'Наша команда имеет опыт анализа текстов и визуализации.'}
    first=client.post(f'/api/challenges/{cid}/applications',json=payload)
    assert first.status_code == 201, first.text
    assert client.post(f'/api/challenges/{cid}/applications',json=payload).status_code == 409
    second=client.post(f'/api/challenges/{cid}/applications',json={**payload,'github_url':'https://github.com/second'}).json()
    aid=first.json()['id']
    assert client.get(f'/api/challenges/{cid}/applications').status_code == 401
    assert client.patch(f'/api/applications/{aid}/select',headers=owner).json()['status']=='SELECTED'
    apps=client.get(f'/api/challenges/{cid}/applications',headers=owner).json()
    assert {a['id']:a['status'] for a in apps} == {aid:'SELECTED',second['id']:'REJECTED'}
    assert client.patch(f'/api/applications/{aid}/select',headers=owner).json()['status']=='SELECTED'
    assert client.patch(f"/api/applications/{second['id']}/select",headers=owner).status_code==409
    assert client.post(f'/api/challenges/{cid}/applications',json={**payload,'github_url':'https://github.com/third'}).status_code==409
    assert client.patch(f'/api/challenges/{cid}',headers=owner,json={'facts':{'goal':'Changed'}}).status_code==409


def test_access_validation(client, owner):
    cid=create(client,owner).json()['id']
    stranger={'X-Business-Key':'b'*64}
    assert client.get(f'/api/challenges/{cid}',headers=stranger).status_code==403
    assert client.post(f'/api/challenges/{cid}/publish',headers=stranger).status_code==403
    assert client.get('/api/challenges/9999',headers=owner).status_code==404
    assert client.post('/api/challenges/analyze',headers=owner,json={'raw_description':' '}).status_code==422
    assert client.post(f'/api/challenges/{cid}/applications',json={'team_name':'a'}).status_code==422
    assert create(client,{}).status_code==401


def test_ai_analysis_and_clarification(client, owner, monkeypatch):
    async def fake(description, confirmed=None):
        return Analysis(title='Анализ отзывов', problem=description if not confirmed else 'AI must not overwrite',
            clarification_questions=[Question(field='available_data',question='Сколько отзывов доступно и в каком формате?')],required_skills=['NLP'],suggested_solution='Предлагается классификация тем')
    monkeypatch.setattr(openai_service,'analyze',fake)
    desc='Мы хотим использовать AI для анализа отзывов студентов.'
    response=client.post('/api/challenges/analyze',headers=owner,json={'raw_description':desc})
    assert response.status_code==201,response.text
    c=response.json();cid=c['id']
    assert c['readiness_score']==15
    r=client.post(f'/api/challenges/{cid}/clarify',headers=owner,json={'answers':{'available_data':'2000 анонимных отзывов CSV'}})
    assert r.status_code==200,r.text
    assert r.json()['readiness_score']==30
    assert r.json()['problem']==desc
    assert r.json()['available_data']=='2000 анонимных отзывов CSV'


def test_ai_failure_keeps_draft(client, owner, monkeypatch):
    cid=create(client,owner).json()['id']
    async def unavailable(*args):
        raise openai_service.AnalysisUnavailable('AI недоступен')
    monkeypatch.setattr(openai_service,'analyze',unavailable)
    assert client.post('/api/challenges/analyze',headers=owner,json={'raw_description':'Описание проблемы для анализа'}).status_code==503
    r=client.post(f'/api/challenges/{cid}/clarify',headers=owner,json={'answers':{'goal':'Экономить время'}})
    assert r.status_code==503
    assert client.get(f'/api/challenges/{cid}',headers=owner).json()['goal'] is None
    assert len(client.get('/api/challenges?scope=mine',headers=owner).json())==1
