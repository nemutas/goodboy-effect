uniform vec3 uMouse;
uniform float uTime;
varying float vDist;

#include '../glsl/noise.glsl'

void main() {
  vec3 pos = position;
  float dist = distance(uMouse, instanceMatrix[3].xyz);
  dist = 1.0 - smoothstep(0.0, 0.3, dist);
  float n = cnoise(vec3(instanceMatrix[3].x * 10.0, instanceMatrix[3].y * 10.0, uTime));
  n = smoothstep(-1.0, 1.0, n);
  pos.z += dist * 0.05 * n;
  vDist = dist;

  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( pos, 1.0 );
}