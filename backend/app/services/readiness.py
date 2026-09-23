WEIGHTS = {
    "problem": 15, "goal": 15, "target_users": 10, "available_data": 15,
    "expected_result": 15, "success_metrics": 15, "constraints": 5, "deadline": 10,
}
PUBLISH_THRESHOLD = 100
UNKNOWN = {"unknown", "missing", "null", "none", "n/a", "неизвестно", "не указано", "неизвестен", "tbd", "-", "?"}


def is_present(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip()) and value.strip().lower() not in UNKNOWN


def calculate_readiness(facts: dict) -> dict:
    completed = [field for field in WEIGHTS if is_present(facts.get(field))]
    return {
        "total_score": sum(WEIGHTS[field] for field in completed),
        "completed_criteria": completed,
        "missing_criteria": [field for field in WEIGHTS if field not in completed],
        "criterion_weights": dict(WEIGHTS),
    }
