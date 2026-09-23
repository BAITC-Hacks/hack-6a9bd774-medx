import asyncio
import json
from types import SimpleNamespace
import httpx
import pytest
from app.schemas import Analysis
from app.services import openai_service, nvidia_service
from app.config import settings


def test_no_keys(client, owner, monkeypatch):
    monkeypatch.setattr(settings,'openai_api_key','')
    monkeypatch.setattr(settings,'nvidia_api_key','')
    assert client.post('/api/challenges/analyze',headers=owner,json={'raw_description':'Хотим анализировать отзывы студентов.'}).status_code==503
    c=client.post('/api/demo',headers=owner).json()
    assert c['is_demo'] is True
    assert c['readiness_score']==100
    review=client.post(f"/api/challenges/{c['id']}/review",headers=owner)
    assert review.status_code==200
    assert review.json()['status']=='unavailable'
    assert client.get(f"/api/challenges/{c['id']}",headers=owner).json()['readiness_score']==100
    assert client.post(f"/api/challenges/{c['id']}/publish",headers=owner).status_code==200


def test_unfounded_ai_facts_removed(monkeypatch):
    monkeypatch.setattr(settings,'openai_api_key','test-placeholder')
    async def parse(**kwargs):
        assert kwargs['text_format'] is Analysis
        assert kwargs['store'] is False
        return SimpleNamespace(output_parsed=Analysis(title='Отзывы',problem='анализ отзывов',goal='invented business fact',available_data='100000 invented records',required_skills=['NLP'],suggested_solution='Maybe NLP',clarification_questions=[]))
    class FakeClient:
        def __init__(self,**kwargs): self.responses=SimpleNamespace(parse=parse)
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
    monkeypatch.setattr(openai_service,'AsyncOpenAI',FakeClient)
    result=asyncio.run(openai_service.analyze('Нам нужен анализ отзывов'))
    assert result.problem=='анализ отзывов'
    assert result.goal is None
    assert result.available_data is None


@pytest.mark.parametrize('mode',['valid','malformed','timeout','http_error','empty'])
def test_nvidia_modes(monkeypatch,mode):
    monkeypatch.setattr(settings,'nvidia_api_key','test-placeholder')
    result={'technical_feasibility':'Прототип возможен','data_readiness':'Нужна разметка','risks':['Качество данных'],'technical_questions':['Кто размечает?'],'review_summary':'Проверьте данные.'}
    def handler(request):
        sent=json.loads(request.content)
        assert 'business_facts' in sent['messages'][1]['content']
        assert 'ai_suggestions' in sent['messages'][1]['content']
        if mode=='timeout': raise httpx.ReadTimeout('timeout',request=request)
        if mode=='http_error': return httpx.Response(503)
        if mode=='empty': return httpx.Response(200,json={'choices':[]})
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(result) if mode=='valid' else 'not json'}}]})
    original=httpx.AsyncClient
    monkeypatch.setattr(nvidia_service.httpx,'AsyncClient',lambda **kwargs: original(transport=httpx.MockTransport(handler),**kwargs))
    response=asyncio.run(nvidia_service.review_challenge({'problem':'Slow analysis'},{}))
    assert response.status==('available' if mode=='valid' else 'unavailable')


def test_unknown_and_injection_validation(client,owner):
    c=client.post('/api/challenges',headers=owner,json={'title':'Без данных','raw_description':'Описание с неизвестными данными','facts':{'available_data':'unknown'}}).json()
    assert c['readiness_score']==0
    assert client.patch(f"/api/challenges/{c['id']}",headers=owner,json={'facts':{},'readiness_score':100}).status_code==422
    assert client.post(f"/api/challenges/{c['id']}/clarify",headers=owner,json={'answers':{'owner_hash':'hacked'}}).status_code==422


def test_review_invalidated_by_edit(client,owner,monkeypatch):
    monkeypatch.setattr(settings,'nvidia_api_key','')
    c=client.post('/api/demo',headers=owner).json()
    client.post(f"/api/challenges/{c['id']}/review",headers=owner)
    updated=client.patch(f"/api/challenges/{c['id']}",headers=owner,json={'facts':{'goal':'Новая бизнес-цель'}}).json()
    assert updated['review'] is None


@pytest.mark.parametrize('mode',['valid','malformed','refusal'])
def test_installed_openai_sdk_structured_parsing(monkeypatch,mode):
    import httpx2
    monkeypatch.setattr(settings,'openai_api_key','test-placeholder')
    original=openai_service.AsyncOpenAI
    def handler(request):
        sent=json.loads(request.content)
        schema=sent['text']['format']['schema']
        assert sent['text']['format']['strict'] is True
        assert schema['additionalProperties'] is False
        assert set(schema['properties'])==set(schema['required'])
        result=Analysis(title='Отзывы студентов',problem='анализ отзывов',required_skills=['NLP'],suggested_solution=None,clarification_questions=[]).model_dump()
        content=({'type':'refusal','refusal':'Cannot analyze'} if mode=='refusal' else {'type':'output_text','text':json.dumps(result) if mode=='valid' else 'invalid json','annotations':[]})
        return httpx2.Response(200,json={'id':'resp_test','object':'response','created_at':1700000000,'status':'completed','model':settings.openai_model,'output':[{'id':'msg_test','type':'message','status':'completed','role':'assistant','content':[content]}],'parallel_tool_calls':False,'tool_choice':'auto','tools':[]})
    monkeypatch.setattr(openai_service,'AsyncOpenAI',lambda **kwargs: original(http_client=httpx2.AsyncClient(transport=httpx2.MockTransport(handler)),**kwargs))
    if mode=='valid':
        result=asyncio.run(openai_service.analyze('Нам нужен анализ отзывов'))
        assert result.problem=='анализ отзывов'
    else:
        with pytest.raises(openai_service.AnalysisUnavailable):
            asyncio.run(openai_service.analyze('Нам нужен анализ отзывов'))
