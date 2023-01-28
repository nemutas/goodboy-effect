# About
This application is a reproduction of [goodboy](https://www.goodboydigital.com/)'s FV animation.<br>
It was also implemented based on a great [video](https://www.youtube.com/live/0Zji936v3yg?feature=share) by [Akella](https://twitter.com/akella).

https://nemutas.github.io/goodboy-effect/

<img src='https://user-images.githubusercontent.com/46724121/215156598-5e09068b-7f7c-4713-9dc3-ddcd29e16c26.png' width='800' />

# References
- [goodboy](https://www.goodboydigital.com/)
- [#s3e8 ALL YOUR HTML, Recreating goodboydigital.com with three.js](https://www.youtube.com/live/0Zji936v3yg?feature=share)

# Memo
instancedMeshで、ひとつひとつのmeshの座標（頂点座標ではない）を参照したい場合は、`instanceMatrix`から取得できる。

https://github.com/nemutas/goodboy-effect/blob/ec3ec0373010068f402d9d68f9216d42863df2d8/src/webgl/shaders/tileVert.glsl#L7-L17

```
vec3 meshPos = instanceMatrix[3].xyz;
```
3次元のアフィン変換行列において、4列目がtranslateに関わる変換なので、`[3].xyz`でアクセスができる。

<img src='https://user-images.githubusercontent.com/46724121/215261792-d3dabb21-c9f9-4edd-ac7d-714c55190ba4.jpg' width='600' />
