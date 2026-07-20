import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from alfred import Alfred

client = Alfred(api_key="sk_test_xxxxx")
try:
    roi = client.opex.get_roi()
    print("SDK Test Success! Loaded templates:", roi["summary"]["template_count"])
except Exception as e:
    print("SDK Test Failed:", e)
