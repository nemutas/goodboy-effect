uniform float uTime;

#include '../glsl/noise.glsl'

void main() {
  float n = cnoise(vec3(position.x * 5.0, position.y * 5.0, uTime * 0.5));
  n = smoothstep(-1.0, 1.0, n) + 0.2;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = n * 0.5 * ( 10.0 / - mvPosition.z );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}