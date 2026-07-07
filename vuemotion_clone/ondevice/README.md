# ondevice/ — live 2D pose preview tier (native, not Python)

Real-time on-device coach feedback: RTMPose-s/m exported via MMDeploy to **CoreML**
(iOS first; ONNX Runtime / TFLite for Android later). Live 2D skeleton overlay + rep
counting, ground-contact time, cadence, basic joint angles, coaching cues.

- **Target:** ≥ 30 fps on the target iPhone, stable skeleton. (RTMPose hits 35+ fps
  on a 2020-era Snapdragon 865; modern A-series exceeds it.)
- **Quantize** to FP16/INT8; validate accuracy retention post-quantization.
- **License:** RTMPose is Apache-2.0; COCO-pretrained base weights are commercial-OK
  with attribution. Do not ship OpenPose/YOLO/Sapiens. See
  `../../docs/vuemotion-clone/LICENSE-CLEARANCE.md`.

This tier is a native iOS (Swift) app, so it lives outside the Python package — this
directory holds the mobile project once P2 begins.

TODO(P2): CoreML export + live preview app.
