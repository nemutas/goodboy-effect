import screenFrag from './shaders/screenFrag.glsl'
import screenVert from './shaders/screenVert.glsl'
import tileFrag from './shaders/tileFrag.glsl'
import tileVert from './shaders/tileVert.glsl'
import dotFrag from './shaders/dotFrag.glsl'
import dotVert from './shaders/dotVert.glsl'

export const shaders = {
  screen: {
    vertex: screenVert,
    fragment: screenFrag,
  },
  tile: {
    vertex: tileVert,
    fragment: tileFrag,
  },
  dot: {
    vertex: dotVert,
    fragment: dotFrag,
  },
}
