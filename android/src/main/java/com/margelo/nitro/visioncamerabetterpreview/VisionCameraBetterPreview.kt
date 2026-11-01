package com.margelo.nitro.visioncamerabetterpreview
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class VisionCameraBetterPreview : HybridVisionCameraBetterPreviewSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
