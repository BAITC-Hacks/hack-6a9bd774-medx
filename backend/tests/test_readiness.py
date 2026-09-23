import pytest
from app.services.readiness import WEIGHTS, calculate_readiness


def test_empty():
    result = calculate_readiness({})
    assert result['total_score'] == 0
    assert result['missing_criteria'] == list(WEIGHTS)
    assert result['completed_criteria'] == []


def test_weights_and_maximum(facts):
    assert sum(WEIGHTS.values()) == 100
    result = calculate_readiness({**facts, 'title': 'Ignored', 'required_skills': ['AI']})
    assert result['total_score'] == 100
    assert result['missing_criteria'] == []


@pytest.mark.parametrize('value', [None, '', '  ', 'unknown', 'не указано', 'null', 'TBD', '?'])
def test_missing(value):
    assert calculate_readiness({'problem': value})['total_score'] == 0


def test_partial():
    result = calculate_readiness({'problem': 'Slow process', 'goal': 'Save time', 'deadline': 'November'})
    assert result['total_score'] == 40
    assert result['completed_criteria'] == ['problem', 'goal', 'deadline']
