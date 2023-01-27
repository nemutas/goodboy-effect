struct TextureData {
  sampler2D texture;
  vec2 uvScale;
};

uniform TextureData uImage;
uniform TextureData uNextImage;
uniform float uSeed;
uniform float uAspect;
uniform float uProgress;
varying vec2 vUv;

const float cellSize = 20.0;

vec4 getTexture(TextureData data) {
  vec2 uv = (vUv - 0.5) * data.uvScale + 0.5;
  return texture2D(data.texture, uv);
}

#include '../glsl/noise.glsl'

void main() {
  vec4 tex1 = getTexture(uImage);
  vec4 tex2 = getTexture(uNextImage);

  
  vec2 cell = floor(vUv * vec2(uAspect, 1.0) * cellSize) / cellSize;

  float n = cnoise(vec3((cell + uSeed) * 5.0, uSeed));
  float progress = uProgress * 2.0;
  n = 1.0 - smoothstep(-1.2 + progress, -1.0 + progress, n);

  vec3 color = mix(tex1.rgb, tex2.rgb, n);

  gl_FragColor = vec4(color, 1.0);
}