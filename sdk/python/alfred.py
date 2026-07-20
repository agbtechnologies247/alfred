# Developed By Bhramit Pardhi. All rights reserved under AGB Technologies LLP.
import requests

class Alfred:
    def __init__(self, api_key: str, base_url: str = "http://localhost:3000"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        self.decisions = DecisionsEndpoint(self)
        self.opex = OpexEndpoint(self)
        self.people = PeopleEndpoint(self)

class DecisionsEndpoint:
    def __init__(self, client):
        self.client = client

    def get_recommendations(self):
        r = requests.get(f"{self.client.base_url}/api/decisions/recommendations", headers=self.client.headers)
        r.raise_for_status()
        return r.json()

    def simulate(self, action_type: str, target_entity_id: str):
        payload = {"action_type": action_type, "target_entity_id": target_entity_id}
        r = requests.post(f"{self.client.base_url}/api/decisions/simulate", json=payload, headers=self.client.headers)
        r.raise_for_status()
        return r.json()

    def approve(self, decision_id: str, reason: str):
        payload = {"decision_id": decision_id, "reason": reason, "decision": "approved"}
        r = requests.post(f"{self.client.base_url}/api/feedback", json=payload, headers=self.client.headers)
        r.raise_for_status()
        return r.json()

class OpexEndpoint:
    def __init__(self, client):
        self.client = client

    def get_roi(self):
        r = requests.get(f"{self.client.base_url}/api/opex/roi", headers=self.client.headers)
        r.raise_for_status()
        return r.json()

class PeopleEndpoint:
    def __init__(self, client):
        self.client = client

    def get_all(self):
        r = requests.get(f"{self.client.base_url}/api/people", headers=self.client.headers)
        r.raise_for_status()
        return r.json()

    def get_insights(self):
        r = requests.get(f"{self.client.base_url}/api/people/insights", headers=self.client.headers)
        r.raise_for_status()
        return r.json()

    def submit_checkin(self, person_id: str, check_in_type: str, mood: str, priority: str, needs_help: bool, blockers: str = None):
        payload = {
            "person_id": person_id,
            "check_in_type": check_in_type,
            "mood": mood,
            "priority": priority,
            "needs_help": needs_help
        }
        if blockers:
            payload["blockers"] = blockers
            
        r = requests.post(f"{self.client.base_url}/api/people/checkin", json=payload, headers=self.client.headers)
        r.raise_for_status()
        return r.json()
