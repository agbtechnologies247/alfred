import os
try:
    import onnx
    from onnx import helper
    from onnx import TensorProto
except ImportError:
    print("Installing 'onnx' library...")
    import subprocess
    subprocess.check_call(["pip", "install", "onnx"])
    import onnx
    from onnx import helper
    from onnx import TensorProto

os.makedirs('models', exist_ok=True)

# Create a simple model: output = input * 0.8
node1 = helper.make_node(
    'Mul',
    inputs=['input', 'weight'],
    outputs=['output'],
)

graph = helper.make_graph(
    [node1],
    'failure-model',
    [helper.make_tensor_value_info('input', TensorProto.FLOAT, [1])],
    [helper.make_tensor_value_info('output', TensorProto.FLOAT, [1])],
    [helper.make_tensor('weight', TensorProto.FLOAT, [1], [0.8])],
)

model = helper.make_model(graph, producer_name='alfred-generator')
onnx.save(model, 'models/failure_predictor.onnx')
print("Tiny ONNX model successfully generated at models/failure_predictor.onnx!")
