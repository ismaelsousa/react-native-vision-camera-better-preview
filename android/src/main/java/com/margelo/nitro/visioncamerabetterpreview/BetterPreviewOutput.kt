package com.margelo.nitro.visioncamerabetterpreview

import android.util.Log
import android.util.Size as AndroidSize
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.ResolutionSelector
import com.margelo.nitro.camera.CameraOrientation
import com.margelo.nitro.camera.HybridCameraPreviewOutputSpec
import com.margelo.nitro.camera.MediaType
import com.margelo.nitro.camera.MirrorMode
import com.margelo.nitro.camera.Size as CameraSize
import com.margelo.nitro.camera.TargetStabilizationMode
import com.margelo.nitro.camera.extensions.converters.fromMirrorMode
import com.margelo.nitro.camera.extensions.converters.toMirrorMode
import com.margelo.nitro.camera.extensions.converters.toSize
import com.margelo.nitro.camera.extensions.surfaceRotation
import com.margelo.nitro.camera.extensions.sortedByClosestTo
import com.margelo.nitro.camera.hybrids.orientation.HybridInterfaceOrientationManager
import com.margelo.nitro.camera.public.NativeCameraOutput
import com.margelo.nitro.camera.public.NativePreviewOutput

class BetterPreviewOutput(
  private val options: BetterPreviewOutputOptions,
) : HybridCameraPreviewOutputSpec(),
  NativeCameraOutput,
  NativePreviewOutput {
  private val orientationManager = HybridInterfaceOrientationManager()
  private var preview: Preview? = null
  private var surfaceProvider: Preview.SurfaceProvider? = null
  private var currentConfiguration: BetterPreviewConfiguration? = null

  override val mediaType = MediaType.VIDEO
  override var outputOrientation: CameraOrientation
    get() = orientationManager.currentOrientation ?: CameraOrientation.UP
    set(_) {
      // Preview orientation follows the current interface orientation.
    }
  override val mirrorMode: MirrorMode
    get() {
      val currentPreview = preview ?: return MirrorMode.AUTO
      return MirrorMode.fromMirrorMode(currentPreview.mirrorMode)
    }
  override val currentResolution: CameraSize?
    get() = preview?.resolutionInfo?.resolution?.toSize()

  override fun setSurfaceProvider(surfaceProvider: Preview.SurfaceProvider) {
    this.surfaceProvider = surfaceProvider
    startOrientationUpdates()
    preview?.surfaceProvider = surfaceProvider
  }

  override fun removeSurfaceProvider(surfaceProvider: Preview.SurfaceProvider) {
    if (this.surfaceProvider !== surfaceProvider) return
    this.surfaceProvider = null
    preview?.surfaceProvider = null
    orientationManager.stopOrientationUpdates()
  }

  override fun createUseCase(
    mirrorMode: MirrorMode,
    config: NativeCameraOutput.Config,
  ): NativeCameraOutput.PreparedUseCase {
    val preparedPreview =
      Preview
        .Builder()
        .apply {
          options.targetResolution?.let { targetResolution ->
            val targetSize =
              AndroidSize(
                targetResolution.width.toInt(),
                targetResolution.height.toInt(),
              )
            val resolutionSelector =
              ResolutionSelector
                .Builder()
                .setResolutionFilter { sizes, _ ->
                  sizes.sortedByClosestTo(targetSize)
                }.build()
            setResolutionSelector(resolutionSelector)
          }

          setMirrorMode(mirrorMode.toMirrorMode())
          when (config.previewStabilizationMode) {
            TargetStabilizationMode.OFF -> setPreviewStabilizationEnabled(false)
            null, TargetStabilizationMode.AUTO -> Unit
            else -> setPreviewStabilizationEnabled(true)
          }
        }.build()

    return NativeCameraOutput.PreparedUseCase(preparedPreview) {
      preview = preparedPreview
      orientationManager.currentOrientation?.let { orientation ->
        preparedPreview.targetRotation = orientation.surfaceRotation
      }
      preparedPreview.surfaceProvider = surfaceProvider
      updateConfiguration(preparedPreview, "use case attached")
    }
  }

  private fun startOrientationUpdates() {
    orientationManager.startOrientationUpdates { orientation ->
      preview?.let { currentPreview ->
        currentPreview.targetRotation = orientation.surfaceRotation
        updateConfiguration(currentPreview, "interface orientation changed")
      }
    }
  }

  private fun updateConfiguration(
    preview: Preview,
    source: String,
  ) {
    val resolutionInfo = preview.resolutionInfo ?: return
    val configuration =
      BetterPreviewConfiguration(
        resolution =
          Size(
            width = resolutionInfo.resolution.width.toDouble(),
            height = resolutionInfo.resolution.height.toDouble(),
          ),
        rotationDegrees = resolutionInfo.rotationDegrees.toDouble(),
      )
    if (configuration == currentConfiguration) return
    currentConfiguration = configuration

    Log.i(
      LOG_TAG,
      "Preview configuration changed ($source): ${resolutionInfo.resolution.width}x${resolutionInfo.resolution.height} @ ${resolutionInfo.rotationDegrees}°",
    )
    options.onConfigurationChanged?.invoke(configuration)
  }

  override fun dispose() {
    orientationManager.stopOrientationUpdates()
    currentConfiguration = null
    preview = null
    super.dispose()
  }

  private companion object {
    const val LOG_TAG = "BetterPreviewOutput"
  }
}
