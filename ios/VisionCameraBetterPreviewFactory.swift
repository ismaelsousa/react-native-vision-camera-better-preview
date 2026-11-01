import NitroModules
import VisionCamera

final class VisionCameraBetterPreviewFactory:
  HybridVisionCameraBetterPreviewFactorySpec
{
  func createPreviewOutput(options: BetterPreviewOutputOptions) throws
    -> any HybridCameraOutputSpec
  {
    return BetterPreviewOutput(options: options)
  }
}
