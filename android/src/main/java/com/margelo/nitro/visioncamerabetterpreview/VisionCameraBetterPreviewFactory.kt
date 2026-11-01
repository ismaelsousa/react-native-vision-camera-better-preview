package com.margelo.nitro.visioncamerabetterpreview

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.camera.HybridCameraOutputSpec

@DoNotStrip
@Keep
class VisionCameraBetterPreviewFactory : HybridVisionCameraBetterPreviewFactorySpec() {
  @DoNotStrip
  @Keep
  override fun createPreviewOutput(options: BetterPreviewOutputOptions): HybridCameraOutputSpec {
    return BetterPreviewOutput(options)
  }
}
