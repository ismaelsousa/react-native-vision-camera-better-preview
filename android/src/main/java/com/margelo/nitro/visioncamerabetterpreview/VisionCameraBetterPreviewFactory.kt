package com.margelo.nitro.visioncamerabetterpreview

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.camera.HybridCameraOutputSpec

@DoNotStrip
@Keep
class VisionCameraBetterPreviewFactory : HybridVisionCameraBetterPreviewFactorySpec() {
  @DoNotStrip
  @Keep
  override fun createPreviewOutput(): HybridCameraOutputSpec {
    throw UnsupportedOperationException("Better Preview output is not implemented yet.")
  }
}
